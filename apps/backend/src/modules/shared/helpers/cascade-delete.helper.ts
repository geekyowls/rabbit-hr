import type { EntityManager } from 'typeorm';

export async function deleteClientCascade(
  manager: EntityManager,
  clientId: string,
  contactId: string,
  organizationId: string,
): Promise<void> {
  await manager.query(
    `DELETE FROM diet_share_links WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM client_diet_days WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM client_meal_time WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM client_vitals WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM counselling_sessions WHERE "clientId" = $1 AND "organizationId" = $2`,
    [clientId, organizationId],
  );
  await manager.query(
    `DELETE FROM notes WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM invoices WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM client_attachments WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM payments WHERE "subscriptionId" IN (
      SELECT id FROM subscriptions WHERE "contactId" = $1 AND "organizationId" = $2
    )`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM subscription_pause_history WHERE "subscriptionId" IN (
      SELECT id FROM subscriptions WHERE "contactId" = $1 AND "organizationId" = $2
    )`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM subscriptions WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM contact_activities WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM contact_interactions WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(
    `DELETE FROM form_submissions WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  const [clientTransformationsTable] = await manager.query(
    `SELECT to_regclass('public.client_transformations') AS "tableName"`,
  );
  if (clientTransformationsTable?.tableName) {
    await manager.query(
      `DELETE FROM client_transformations WHERE "clientId" = $1 AND "organizationId" = $2`,
      [clientId, organizationId],
    );
  }
  await manager.query(`DELETE FROM client_credentials WHERE "clientId" = $1`, [
    clientId,
  ]);
  await manager.query(`DELETE FROM clients WHERE id = $1`, [clientId]);
  await manager.query(
    `DELETE FROM leads WHERE "contactId" = $1 AND "organizationId" = $2`,
    [contactId, organizationId],
  );
  await manager.query(`DELETE FROM contacts WHERE id = $1`, [contactId]);
}
