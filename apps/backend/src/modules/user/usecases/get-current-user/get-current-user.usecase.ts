import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository, OrganizationConfigRepository } from '@db/repositories';
import { UserStatus, OrganizationConfigType } from '@db/enums';
import { resolveAtsSettings } from '@db/entities';
import { buildUrl, getFeatureControl } from '@boilerplate/core';

const DEFAULT_CLIENT_TAGS = [
  { id: 'default-vip', name: 'VIP', isDefault: true },
  { id: 'default-fussy', name: 'Fussy', isDefault: true },
  { id: 'default-diabetic', name: 'Diabetic', isDefault: true },
  { id: 'default-vegetarian', name: 'Vegetarian', isDefault: true },
  { id: 'default-new', name: 'New', isDefault: true },
];

const DEFAULT_MESSAGE_TEMPLATES = [
  { id: 'default-diet-ready', name: 'Diet Plan Ready', isDefault: true },
  {
    id: 'default-followup-reminder',
    name: 'Follow-up Reminder',
    isDefault: true,
  },
  {
    id: 'default-record-weight',
    name: 'Record Weight Request',
    isDefault: true,
  },
  { id: 'default-custom', name: 'Custom Message', isDefault: true },
];

const DEFAULT_MEDICAL_CONDITIONS = [
  { id: 'default-diabetes', name: 'Diabetes', isDefault: true },
  { id: 'default-hypertension', name: 'Hypertension', isDefault: true },
  { id: 'default-thyroid', name: 'Thyroid', isDefault: true },
  { id: 'default-pcos', name: 'PCOS', isDefault: true },
  { id: 'default-cholesterol', name: 'Cholesterol', isDefault: true },
  { id: 'default-heart-disease', name: 'Heart Disease', isDefault: true },
  { id: 'default-asthma', name: 'Asthma', isDefault: true },
  { id: 'default-arthritis', name: 'Arthritis', isDefault: true },
];

const DEFAULT_ALLERGIES = [
  { id: 'default-gluten', name: 'Gluten', isDefault: true },
  { id: 'default-dairy', name: 'Dairy', isDefault: true },
  { id: 'default-nuts', name: 'Nuts', isDefault: true },
  { id: 'default-shellfish', name: 'Shellfish', isDefault: true },
  { id: 'default-eggs', name: 'Eggs', isDefault: true },
  { id: 'default-soy', name: 'Soy', isDefault: true },
  { id: 'default-wheat', name: 'Wheat', isDefault: true },
  { id: 'default-lactose', name: 'Lactose', isDefault: true },
];

const DEFAULT_HEALTH_OBJECTIVES = [
  { id: 'default-weight-loss', name: 'Weight Loss', isDefault: true },
  { id: 'default-weight-gain', name: 'Weight Gain', isDefault: true },
  { id: 'default-muscle-building', name: 'Muscle Building', isDefault: true },
  { id: 'default-maintain-weight', name: 'Maintain Weight', isDefault: true },
  { id: 'default-improve-energy', name: 'Improve Energy', isDefault: true },
  { id: 'default-manage-diabetes', name: 'Manage Diabetes', isDefault: true },
  {
    id: 'default-lower-cholesterol',
    name: 'Lower Cholesterol',
    isDefault: true,
  },
  { id: 'default-better-sleep', name: 'Better Sleep', isDefault: true },
];

@Injectable()
export class GetCurrentUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationConfigRepository: OrganizationConfigRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect(['user.inviteToken', 'user.inviteExpires', 'user.metadata'])
      .leftJoinAndSelect('user.organization', 'organization')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build invite link if user is in INVITED state
    const frontendBaseUrl = this.configService.get<string>('FRONTEND_BASE_URL');
    const inviteLink =
      user.status === UserStatus.INVITED && user.inviteToken
        ? buildUrl(frontendBaseUrl, `/accept-invite?token=${user.inviteToken}`)
        : null;

    // Fetch organization config
    const configs =
      await this.organizationConfigRepository.findByOrganizationId(
        user.organizationId,
      );

    // Group configs by type dynamically
    const configsByType = configs.reduce(
      (acc, c) => {
        if (!acc[c.type]) acc[c.type] = [];
        acc[c.type].push({ id: c.id, name: c.name, isDefault: c.isDefault });
        return acc;
      },
      {} as Record<
        string,
        Array<{ id: string; name: string; isDefault: boolean }>
      >,
    );

    // Merge defaults with DB entries (dedupe by name, case-insensitive)
    const dbTags = configsByType[OrganizationConfigType.CLIENT_TAG] || [];
    const defaultTagNames = new Set(
      DEFAULT_CLIENT_TAGS.map((t) => t.name.toLowerCase()),
    );
    const clientTags = [
      ...DEFAULT_CLIENT_TAGS,
      ...dbTags.filter((t) => !defaultTagNames.has(t.name.toLowerCase())),
    ];

    const dbTemplates =
      configsByType[OrganizationConfigType.MESSAGE_TEMPLATE] || [];
    const defaultTemplateNames = new Set(
      DEFAULT_MESSAGE_TEMPLATES.map((t) => t.name.toLowerCase()),
    );
    const messageTemplates = [
      ...DEFAULT_MESSAGE_TEMPLATES,
      ...dbTemplates.filter(
        (t) => !defaultTemplateNames.has(t.name.toLowerCase()),
      ),
    ];

    const dbConditions =
      configsByType[OrganizationConfigType.MEDICAL_CONDITION] || [];
    const defaultConditionNames = new Set(
      DEFAULT_MEDICAL_CONDITIONS.map((t) => t.name.toLowerCase()),
    );
    const medicalConditions = [
      ...DEFAULT_MEDICAL_CONDITIONS,
      ...dbConditions.filter(
        (t) => !defaultConditionNames.has(t.name.toLowerCase()),
      ),
    ];

    const dbAllergies = configsByType[OrganizationConfigType.ALLERGY] || [];
    const defaultAllergyNames = new Set(
      DEFAULT_ALLERGIES.map((t) => t.name.toLowerCase()),
    );
    const allergies = [
      ...DEFAULT_ALLERGIES,
      ...dbAllergies.filter(
        (t) => !defaultAllergyNames.has(t.name.toLowerCase()),
      ),
    ];

    const dbObjectives =
      configsByType[OrganizationConfigType.HEALTH_OBJECTIVE] || [];
    const defaultObjectiveNames = new Set(
      DEFAULT_HEALTH_OBJECTIVES.map((t) => t.name.toLowerCase()),
    );
    const healthObjectives = [
      ...DEFAULT_HEALTH_OBJECTIVES,
      ...dbObjectives.filter(
        (t) => !defaultObjectiveNames.has(t.name.toLowerCase()),
      ),
    ];

    const iapEnabled = getFeatureControl(
      user.organization.featureControls,
      'iapEnabled',
    );

    const canUseDemoScreens = getFeatureControl(
      user.organization.featureControls,
      'canUseDemoScreens',
    );

    const coBrandingEnabled = getFeatureControl(
      user.organization.featureControls,
      'coBrandingEnabled',
    );

    const coBrandingOrder = getFeatureControl(
      user.organization.featureControls,
      'coBrandingOrder',
    );

    // Return secure user data (exclude sensitive fields)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      isActive: user.isActive,
      onboarded: user.onboarded,
      tourCompleted: user.tourCompleted,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
        logo: user.organization.logo,
        isSystemOrg: user.organization.isSystemOrg,
        address: user.organization.address,
        subscriptionStatus: user.organization.subscriptionStatus,
        trialEndsAt: user.organization.trialEndsAt,
        subscriptionEndsAt: user.organization.subscriptionEndsAt,
        iapEnabled,
        canUseDemoScreens,
        coBrandingEnabled,
        coBrandingOrder,
        atsSettings: resolveAtsSettings(user.organization.atsSettings),
      },
      roleId: user.roleId,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      invitedBy: user.invitedBy,
      inviteLink,
      inviteExpires: user.inviteExpires,
      organizationConfig: {
        clientTags,
        messageTemplates,
        medicalConditions,
        allergies,
        healthObjectives,
      },
      pagePreferences:
        (user.metadata as Record<string, unknown>)?.pagePreferences ?? {},
    };
  }
}
