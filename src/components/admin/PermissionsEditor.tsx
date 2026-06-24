/* eslint-disable react-refresh/only-export-components -- shadcn pattern: variants/utilities co-localizados com o componente */
import { useState, useMemo } from 'react';

const PermissionsEditor = ({ currentPermissions, onSave, onCancel }: {
  currentPermissions: string[];
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissions);
  // Implementation of PermissionsEditor...
  return null;
};
