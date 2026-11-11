import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationAtsSettings, resolveAtsSettings } from '@db/entities';
import { OrganizationRepository } from '@db/repositories';
import { pickDefined } from '@shared/helpers/pick-defined';
import { UpdateAtsSettingsCommand } from './update-ats-settings.command';

function assertTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new BadRequestException(`Invalid timezone: ${timezone}`);
  }
}

function canonicalLocale(locale: string): string {
  try {
    const [canonical] = Intl.getCanonicalLocales(locale);
    if (!canonical) throw new Error();
    return canonical;
  } catch {
    throw new BadRequestException(`Invalid locale: ${locale}`);
  }
}

function normalizeDepartments(departments: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const department of departments) {
    const name = department.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

@Injectable()
export class UpdateAtsSettings {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(
    command: UpdateAtsSettingsCommand,
  ): Promise<OrganizationAtsSettings> {
    const organization = await this.organizationRepository.findOne({
      where: { id: command.organizationId },
      select: ['id', 'atsSettings'],
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const changes = pickDefined(command.payload);
    if (changes.timezone) assertTimezone(changes.timezone);
    if (changes.locale) changes.locale = canonicalLocale(changes.locale);
    if (changes.departments) {
      changes.departments = normalizeDepartments(changes.departments);
    }

    const settings = {
      ...resolveAtsSettings(organization.atsSettings),
      ...changes,
    };
    await this.organizationRepository.update(
      { id: organization.id },
      { atsSettings: settings },
    );
    return settings;
  }
}
