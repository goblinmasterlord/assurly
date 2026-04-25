# Assurly Frontend: Standard & Aspect Deletion/Reinstatement

**Date:** 2025-01-05  
**Version:** 5.1.0

## Overview

The backend now supports two deletion behaviors:

| Type | Delete | Reinstate |
|------|--------|-----------|
| **Default** (from global templates) | Deactivated, can be reinstated | ✅ Yes |
| **Custom** (MAT-created) | Archived permanently | ❌ No (create new) |

The frontend needs to:
1. Show which standards/aspects are default vs custom
2. Allow deletion of both types
3. Show deactivated defaults with option to reinstate
4. Prevent reinstatement of custom items

---

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/standards/{id}` | DELETE | Deactivate/archive standard |
| `/api/standards/{id}/reinstate` | POST | Reinstate default standard |
| `/api/standards/inactive` | GET | List deactivated default standards |
| `/api/aspects/{id}` | DELETE | Deactivate/archive aspect |
| `/api/aspects/{id}/reinstate` | POST | Reinstate default aspect |
| `/api/aspects/inactive` | GET | List deactivated default aspects |

---

## Type Updates

```typescript
// src/types/assessment.ts

// DELETE response
interface DeleteStandardResponse {
    message: string;
    mat_standard_id: string;
    is_custom: boolean;
    archived_as: string | null;
    can_reinstate: boolean;
}

interface DeleteAspectResponse {
    message: string;
    mat_aspect_id: string;
    is_custom: boolean;
    archived_as: string | null;
    can_reinstate: boolean;
}

// Reinstate response
interface ReinstateResponse {
    message: string;
    mat_standard_id?: string;
    mat_aspect_id?: string;
}
```

---

## API Service Updates

```typescript
// src/api/standards.ts

export async function deleteStandard(matStandardId: string): Promise<DeleteStandardResponse> {
    return api.delete(`/api/standards/${matStandardId}`);
}

export async function reinstateStandard(matStandardId: string): Promise<ReinstateResponse> {
    return api.post(`/api/standards/${matStandardId}/reinstate`);
}

export async function getInactiveStandards(): Promise<Standard[]> {
    return api.get('/api/standards/inactive');
}

// src/api/aspects.ts

export async function deleteAspect(matAspectId: string): Promise<DeleteAspectResponse> {
    return api.delete(`/api/aspects/${matAspectId}`);
}

export async function reinstateAspect(matAspectId: string): Promise<ReinstateResponse> {
    return api.post(`/api/aspects/${matAspectId}/reinstate`);
}

export async function getInactiveAspects(): Promise<Aspect[]> {
    return api.get('/api/aspects/inactive');
}
```

---

## UI Components

### 1. Delete Confirmation Modal

Show different messages based on `is_custom`:

```tsx
// src/components/DeleteStandardModal.tsx

interface DeleteStandardModalProps {
    standard: Standard;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteStandardModal: React.FC<DeleteStandardModalProps> = ({
    standard,
    isOpen,
    onClose,
    onConfirm
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader>
                Delete Standard: {standard.standard_name}
            </ModalHeader>
            
            <ModalBody>
                {standard.is_custom ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-orange-600">
                            <WarningIcon />
                            <span className="font-medium">This is a custom standard</span>
                        </div>
                        <p>
                            This standard will be <strong>permanently archived</strong>. 
                            You will not be able to reinstate it, but you can create a 
                            new standard with the same code later.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-blue-600">
                            <InfoIcon />
                            <span className="font-medium">This is a default standard</span>
                        </div>
                        <p>
                            This standard will be <strong>deactivated</strong>. 
                            You can reinstate it later from the "Inactive Standards" section.
                        </p>
                    </div>
                )}
                
                <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                        <strong>Note:</strong> Any existing assessments using this standard 
                        will be preserved but the standard will no longer appear in new assessments.
                    </p>
                </div>
            </ModalBody>
            
            <ModalFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="danger" onClick={onConfirm}>
                    {standard.is_custom ? 'Archive Standard' : 'Deactivate Standard'}
                </Button>
            </ModalFooter>
        </Modal>
    );
};
```

### 2. Custom Badge Component

Show whether standard/aspect is custom or default:

```tsx
// src/components/CustomBadge.tsx

interface CustomBadgeProps {
    isCustom: boolean;
}

const CustomBadge: React.FC<CustomBadgeProps> = ({ isCustom }) => {
    if (isCustom) {
        return (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                Custom
            </span>
        );
    }
    return (
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
            Default
        </span>
    );
};
```

### 3. Inactive Standards Panel

```tsx
// src/components/InactiveStandardsPanel.tsx

const InactiveStandardsPanel: React.FC = () => {
    const [inactiveStandards, setInactiveStandards] = useState<Standard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInactiveStandards();
    }, []);

    const loadInactiveStandards = async () => {
        setLoading(true);
        try {
            const standards = await getInactiveStandards();
            setInactiveStandards(standards);
        } catch (error) {
            toast.error('Failed to load inactive standards');
        } finally {
            setLoading(false);
        }
    };

    const handleReinstate = async (matStandardId: string) => {
        try {
            await reinstateStandard(matStandardId);
            toast.success('Standard reinstated successfully');
            loadInactiveStandards();
            // Also refresh active standards list
        } catch (error) {
            toast.error('Failed to reinstate standard');
        }
    };

    if (loading) return <Spinner />;

    if (inactiveStandards.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No inactive standards</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Inactive Standards</h3>
            <p className="text-sm text-gray-600">
                These default standards have been deactivated. Click "Reinstate" to add them back.
            </p>
            
            <div className="divide-y">
                {inactiveStandards.map(standard => (
                    <div 
                        key={standard.mat_standard_id} 
                        className="py-3 flex items-center justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{standard.standard_code}</span>
                                <span className="text-gray-600">{standard.standard_name}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {standard.aspect_name}
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReinstate(standard.mat_standard_id)}
                        >
                            Reinstate
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

### 4. Inactive Aspects Panel

```tsx
// src/components/InactiveAspectsPanel.tsx

const InactiveAspectsPanel: React.FC = () => {
    const [inactiveAspects, setInactiveAspects] = useState<Aspect[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInactiveAspects();
    }, []);

    const loadInactiveAspects = async () => {
        setLoading(true);
        try {
            const aspects = await getInactiveAspects();
            setInactiveAspects(aspects);
        } catch (error) {
            toast.error('Failed to load inactive aspects');
        } finally {
            setLoading(false);
        }
    };

    const handleReinstate = async (matAspectId: string) => {
        try {
            await reinstateAspect(matAspectId);
            toast.success('Aspect and its standards reinstated successfully');
            loadInactiveAspects();
            // Also refresh active aspects list
        } catch (error) {
            toast.error('Failed to reinstate aspect');
        }
    };

    if (loading) return <Spinner />;

    if (inactiveAspects.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>No inactive aspects</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Inactive Aspects</h3>
            <p className="text-sm text-gray-600">
                These default aspects have been deactivated. Reinstating an aspect will also 
                reinstate all its default standards.
            </p>
            
            <div className="divide-y">
                {inactiveAspects.map(aspect => (
                    <div 
                        key={aspect.mat_aspect_id} 
                        className="py-3 flex items-center justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{aspect.aspect_name}</span>
                                <AspectCategoryBadge category={aspect.aspect_category} />
                            </div>
                            <div className="text-sm text-gray-500">
                                {aspect.standards_count} standards
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReinstate(aspect.mat_aspect_id)}
                        >
                            Reinstate
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

---

## Page Updates

### Standards Admin Page

```tsx
// src/pages/admin/Standards.tsx

const StandardsAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
    const [standards, setStandards] = useState<Standard[]>([]);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        standard: Standard | null;
    }>({ isOpen: false, standard: null });

    const handleDelete = async () => {
        if (!deleteModal.standard) return;
        
        try {
            const result = await deleteStandard(deleteModal.standard.mat_standard_id);
            
            if (result.can_reinstate) {
                toast.success('Standard deactivated. You can reinstate it from the Inactive tab.');
            } else {
                toast.success('Standard archived permanently.');
            }
            
            setDeleteModal({ isOpen: false, standard: null });
            loadStandards();
        } catch (error) {
            toast.error('Failed to delete standard');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Standards Management</h1>
                <Button onClick={() => openCreateModal()}>
                    Add Standard
                </Button>
            </div>
            
            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4">
                    <button
                        className={`pb-2 px-1 ${activeTab === 'active' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500'}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Standards
                    </button>
                    <button
                        className={`pb-2 px-1 ${activeTab === 'inactive' 
                            ? 'border-b-2 border-blue-500 text-blue-600' 
                            : 'text-gray-500'}`}
                        onClick={() => setActiveTab('inactive')}
                    >
                        Inactive Standards
                    </button>
                </nav>
            </div>
            
            {/* Content */}
            {activeTab === 'active' ? (
                <StandardsTable 
                    standards={standards}
                    onDelete={(standard) => setDeleteModal({ isOpen: true, standard })}
                />
            ) : (
                <InactiveStandardsPanel />
            )}
            
            {/* Delete Modal */}
            {deleteModal.standard && (
                <DeleteStandardModal
                    standard={deleteModal.standard}
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, standard: null })}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
};
```

---

## Standards Table with Custom Badge

```tsx
// src/components/StandardsTable.tsx

interface StandardsTableProps {
    standards: Standard[];
    onDelete: (standard: Standard) => void;
}

const StandardsTable: React.FC<StandardsTableProps> = ({ standards, onDelete }) => {
    return (
        <table className="min-w-full divide-y divide-gray-200">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Aspect</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {standards.map(standard => (
                    <tr key={standard.mat_standard_id}>
                        <td className="font-mono">{standard.standard_code}</td>
                        <td>{standard.standard_name}</td>
                        <td>
                            <StandardTypeBadge type={standard.standard_type} />
                        </td>
                        <td>
                            <CustomBadge isCustom={standard.is_custom} />
                        </td>
                        <td>{standard.aspect_name}</td>
                        <td>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => onEdit(standard)}>
                                    Edit
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600"
                                    onClick={() => onDelete(standard)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
```

---

## Migration Checklist

### Types
- [ ] Add `DeleteStandardResponse` type
- [ ] Add `DeleteAspectResponse` type
- [ ] Add `ReinstateResponse` type

### API Services
- [ ] Add `deleteStandard()` function
- [ ] Add `reinstateStandard()` function
- [ ] Add `getInactiveStandards()` function
- [ ] Add `deleteAspect()` function
- [ ] Add `reinstateAspect()` function
- [ ] Add `getInactiveAspects()` function

### Components
- [ ] Create `DeleteStandardModal` with custom vs default messaging
- [ ] Create `DeleteAspectModal` with custom vs default messaging
- [ ] Create `CustomBadge` component
- [ ] Create `InactiveStandardsPanel` component
- [ ] Create `InactiveAspectsPanel` component
- [ ] Update `StandardsTable` to show custom badge

### Pages
- [ ] Add tabs to Standards admin page (Active / Inactive)
- [ ] Add tabs to Aspects admin page (Active / Inactive)
- [ ] Wire up delete confirmation modals
- [ ] Wire up reinstate functionality

---

## UX Considerations

1. **Clear messaging**: Users should understand the difference between deactivating and archiving
2. **Confirmation dialogs**: Always confirm before deleting
3. **Easy reinstatement**: Inactive items should be easy to find and reinstate
4. **Visual distinction**: Use badges/colors to distinguish custom vs default
5. **Toast notifications**: Confirm actions with appropriate messages

---

**Document Version:** 5.1.0  
**Last Updated:** 2025-01-05
