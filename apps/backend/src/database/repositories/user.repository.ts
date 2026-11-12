import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserStatus } from '../enums';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.findOne({ where: { id } });
  }

  async assertInOrganization(
    id: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!id) return;
    const exists = await this.exists({ where: { id, organizationId } });
    if (!exists) {
      throw new BadRequestException('User not found in this organization');
    }
  }

  async findByInviteToken(token: string): Promise<UserEntity | null> {
    return this.createQueryBuilder('user')
      .addSelect(['user.inviteToken', 'user.inviteExpires'])
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.inviteToken = :token', { token })
      .getOne();
  }

  async findDropdownByOrganizationId(organizationId: string): Promise<
    Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    }>
  > {
    return this.find({
      where: { organizationId, status: UserStatus.ACTIVE },
      select: ['id', 'firstName', 'lastName', 'email'],
      order: { firstName: 'ASC', lastName: 'ASC', email: 'ASC' },
    });
  }
}
