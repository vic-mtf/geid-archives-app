interface Privilege {
  app: string;
  [key: string]: unknown;
}

interface AuthObject {
  name?: string;
  privileges?: Privilege[];
  [key: string]: unknown;
}

export default function checkAuth(
  auth: AuthObject | null | undefined,
  permissions: string[] = []
): boolean {
  let validate = auth?.name === "admin" || permissions?.length === 0;
  if (!validate)
    permissions.forEach((permission) => {
      const privileges = auth?.privileges;
      if (privileges?.map(({ app }) => app)?.includes(permission))
        validate = true;
    });
  return Boolean(validate);
}
