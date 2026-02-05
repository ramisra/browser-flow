export interface IntegrationMetadataField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  inputType?: "text" | "password";
}

export const integrationMetadataConfig: Record<string, IntegrationMetadataField[]> = {
  notion: [
    {
      key: "parent_page_id",
      label: "Parent Page ID",
      placeholder: "Enter Notion parent page ID",
      required: true,
      helpText: "The Notion page where new content will be created.",
      inputType: "text",
    },
  ],
};

export function getIntegrationMetadataFields(
  integrationId: string,
): IntegrationMetadataField[] {
  return integrationMetadataConfig[integrationId] ?? [];
}

export function getIntegrationMetadataDefaults(
  integrationId: string,
): Record<string, string> {
  const fields = getIntegrationMetadataFields(integrationId);
  return fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}
