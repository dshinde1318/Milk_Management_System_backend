import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User, UserRole } from './entities/user.entity';

type BuyerInput = Omit<CreateUserDto, 'role'>;
type PendingInput = Pick<CreateUserDto, 'openingPendingAmount' | 'pendingAmount' | 'due'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  sanitizeUser(user: User): User {
    const sanitized = { ...user } as Partial<User> & { due?: number };
    delete sanitized.password;
    const openingPending = Number(sanitized.openingPendingAmount ?? 0);
    const pending = Number(sanitized.pendingAmount ?? openingPending);
    sanitized.openingPendingAmount = openingPending;
    sanitized.pendingAmount = pending;
    sanitized.due = pending;
    return sanitized as User;
  }

  private sanitizeUsers(users: User[]): User[] {
    return users.map((user) => this.sanitizeUser(user));
  }

  private async assertMobileUnique(mobile: string, excludeId?: string): Promise<void> {
    const existing = await this.usersRepository.findOne({ where: { mobile } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Mobile number already registered');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.assertMobileUnique(createUserDto.mobile);
    const pending = this.normalizeCreatePendingAmounts(createUserDto);

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.SELLER,
      isActive: createUserDto.isActive ?? true,
      openingPendingAmount: pending.openingPendingAmount,
      pendingAmount: pending.pendingAmount,
    });

    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async createBuyer(input: BuyerInput): Promise<User> {
    return this.create({
      ...input,
      role: UserRole.BUYER,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByMobileWithPassword(mobile: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { mobile } });
  }

  async findAll(query?: QueryUserDto): Promise<User[]> {
    const role = query?.role;
    const searchTerm = (query?.search ?? query?.q ?? '').trim();
    const hasSearch = searchTerm.length > 0;

    let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] | undefined;

    if (hasSearch) {
      const searchLike = ILike(`%${searchTerm}%`);
      const baseWhere: Partial<FindOptionsWhere<User>> = {};
      if (role) {
        baseWhere.role = role;
      }

      where = [
        { ...baseWhere, name: searchLike } as FindOptionsWhere<User>,
        { ...baseWhere, mobile: searchLike } as FindOptionsWhere<User>,
        { ...baseWhere, email: searchLike } as FindOptionsWhere<User>,
      ];
    } else if (role) {
      where = { role };
    }

    const users = await this.usersRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return this.sanitizeUsers(users);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.mobile && updateUserDto.mobile !== user.mobile) {
      await this.assertMobileUnique(updateUserDto.mobile, id);
    }

    const { openingPendingAmount, pendingAmount, due, ...rest } = updateUserDto;
    Object.assign(user, rest);

    const pendingPatch = this.normalizeUpdatePendingAmounts({
      openingPendingAmount,
      pendingAmount,
      due,
    });
    if (pendingPatch.openingPendingAmount !== undefined) {
      user.openingPendingAmount = pendingPatch.openingPendingAmount;
    }
    if (pendingPatch.pendingAmount !== undefined) {
      user.pendingAmount = pendingPatch.pendingAmount;
    }

    const updated = await this.usersRepository.save(user);
    return this.sanitizeUser(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = !user.isActive;
    const updated = await this.usersRepository.save(user);
    return this.sanitizeUser(updated);
  }

  async findAllBuyers(): Promise<User[]> {
    const buyers = await this.usersRepository.find({
      where: { role: UserRole.BUYER },
      order: { createdAt: 'DESC' },
    });
    return this.sanitizeUsers(buyers);
  }

  async findBuyerById(id: string): Promise<User> {
    const buyer = await this.usersRepository.findOne({
      where: { id, role: UserRole.BUYER },
    });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    return this.sanitizeUser(buyer);
  }

  async updateBuyer(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findBuyerById(id);
    return this.update(id, updateUserDto);
  }

  async deleteBuyer(id: string): Promise<void> {
    await this.findBuyerById(id);
    await this.delete(id);
  }

  async toggleBuyerActive(id: string): Promise<User> {
    await this.findBuyerById(id);
    return this.toggleActive(id);
  }

  async findSellerById(id: string): Promise<User> {
    const seller = await this.usersRepository.findOne({
      where: { id, role: UserRole.SELLER },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return this.sanitizeUser(seller);
  }

  async deleteSeller(id: string): Promise<void> {
    await this.findSellerById(id);
    await this.delete(id);
  }

  private normalizeCreatePendingAmounts(input: PendingInput): {
    openingPendingAmount: number;
    pendingAmount: number;
  } {
    const openingPendingAmount = Number(
      this.firstDefined(input.openingPendingAmount, input.pendingAmount, input.due, 0),
    );
    const pendingAmount = Number(
      this.firstDefined(input.pendingAmount, input.due, input.openingPendingAmount, openingPendingAmount),
    );
    return {
      openingPendingAmount,
      pendingAmount,
    };
  }

  private normalizeUpdatePendingAmounts(input: PendingInput): {
    openingPendingAmount?: number;
    pendingAmount?: number;
  } {
    const hasOpening = input.openingPendingAmount !== undefined;
    const hasPending = input.pendingAmount !== undefined || input.due !== undefined;

    if (!hasOpening && !hasPending) {
      return {};
    }

    const patch: { openingPendingAmount?: number; pendingAmount?: number } = {};
    if (hasOpening) {
      patch.openingPendingAmount = Number(input.openingPendingAmount);
    }
    if (hasPending) {
      patch.pendingAmount = Number(this.firstDefined(input.pendingAmount, input.due));
    } else if (hasOpening) {
      patch.pendingAmount = Number(input.openingPendingAmount);
    }

    return patch;
  }

  private firstDefined<T>(...values: Array<T | undefined>): T | undefined {
    for (const value of values) {
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }
}
