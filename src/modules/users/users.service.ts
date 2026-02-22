import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { User, UserRole } from './entities/user.entity';

type BuyerInput = Omit<CreateUserDto, 'role'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  sanitizeUser(user: User): User {
    const sanitized = { ...user } as Partial<User>;
    delete sanitized.password;
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

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.SELLER,
      isActive: createUserDto.isActive ?? true,
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
    const where: FindOptionsWhere<User> = {};
    if (query?.role) {
      where.role = query.role;
    }

    const users = await this.usersRepository.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
    });
    return this.sanitizeUsers(users);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.mobile && updateUserDto.mobile !== user.mobile) {
      await this.assertMobileUnique(updateUserDto.mobile, id);
    }

    Object.assign(user, updateUserDto);
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
}
