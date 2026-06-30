import React, { useState, useEffect } from "react"
import type { MouseEvent, ChangeEvent } from "react"
import {
  Users,
  Globe,
  Mail,
  Building,
  MapPin,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  GripVertical
} from "lucide-react"
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import PageTransition from './PageTransition';
import api from '../config/api';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';



// Define types for committee members
type MemberRole =
  | "Conference Chair"
  | "Conference Co-Chair"
  | "Organizing Chair"
  | "Technical Program Chair"
  | "Publication Chair"
  | "Publicity Chair"
  | "Local Arrangement Chair"
  | "Advisory Board"
  | "Conference Coordinators"
  | "Committee Members"

interface CommitteeMember {
  _id?: string
  name: string
  role: MemberRole
  affiliation: string
  country?: string
  designation?: string
  image?: string
  links?: {
    email?: string
    website?: string
    linkedin?: string
    twitter?: string
  }
  order?: number
  active?: boolean
}

const roleFilters: MemberRole[] = [
  "Conference Chair",
  "Conference Co-Chair",
  "Organizing Chair",
  "Technical Program Chair",
  "Publication Chair",
  "Publicity Chair",
  "Local Arrangement Chair",
  "Advisory Board",
  "Conference Coordinators",
  "Committee Members"
]

// Sortable Item Component
const SortableMemberCard = ({ member, isAdmin, onEdit, onDelete, onToggleActive, canReorder }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 relative group
        ${isAdmin && !member.active ? 'opacity-50 border-2 border-red-300' : 'border-2 border-transparent'}
        ${isDragging ? 'shadow-2xl ring-4 ring-[#F5A051]/50 scale-105 z-50 cursor-grabbing' : 'hover:-translate-y-1'}`}
      {...(canReorder ? { ...attributes, ...listeners } : {})}
    >
      <div className="p-6">
        {canReorder && (
          <div
            className="absolute top-3 left-3 text-gray-300 group-hover:text-[#F5A051] transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <div className="flex flex-col items-center mb-4 pt-2">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-4 border-gray-100 shadow-inner group-hover:border-[#F5A051]/30 transition-colors">
            <img
              src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=F5A051&color=fff&size=100`}
              alt={member.name}
              className="w-full h-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=F5A051&color=fff&size=100`;
              }}
            />
          </div>
        </div>

        <div className="pointer-events-auto">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-800 flex-1">{member.name}</h3>
            {isAdmin && (
              <div className="flex gap-2 ml-2 pointer-events-auto">
                <button
                  onClickCapture={(e: MouseEvent) => { e.stopPropagation(); onEdit(member); }}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors"
                  title="Edit member"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClickCapture={(e: MouseEvent) => { e.stopPropagation(); member._id && onDelete(member._id, member.name); }}
                  className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors"
                  title="Delete member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="bg-[#F5A051]/20 text-[#F5A051] text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-2">
            {member.role}
          </div>
          {isAdmin && (
            <button
              onClickCapture={(e: MouseEvent) => { e.stopPropagation(); member._id && onToggleActive(member._id, member.active || false); }}
              className={`ml-2 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${member.active
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
            >
              {member.active ? 'Active' : 'Inactive'}
            </button>
          )}
          {member.designation && (
            <p className="text-gray-700 text-sm font-semibold mt-2">{member.designation}</p>
          )}
          <p className="text-gray-600 text-sm flex items-center mt-1">
            <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {member.affiliation}
          </p>
          {member.country && (
            <p className="text-gray-600 text-sm flex items-center mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              {member.country}
            </p>
          )}
        </div>

        {/* Social Links */}
        {member.links && Object.keys(member.links).length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex space-x-4 justify-center pointer-events-auto">
            {member.links.email && (
              <a
                href={`mailto:${member.links.email}`}
                onClick={(e: MouseEvent) => e.stopPropagation()}
                className="text-gray-400 hover:text-[#F5A051] transition-colors p-1"
                aria-label={`Email ${member.name}`}
              >
                <Mail className="w-5 h-5" />
              </a>
            )}
            {member.links.website && (
              <a
                href={member.links.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: MouseEvent) => e.stopPropagation()}
                className="text-gray-400 hover:text-[#F5A051] transition-colors p-1"
                aria-label={`${member.name}'s website`}
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
            {member.links.linkedin && (
              <a
                href={member.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: MouseEvent) => e.stopPropagation()}
                className="text-gray-400 hover:text-[#F5A051] transition-colors p-1"
                aria-label={`${member.name}'s LinkedIn profile`}
              >
                <FaLinkedin className="w-5 h-5" />
              </a>
            )}
            {member.links.twitter && (
              <a
                href={member.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: MouseEvent) => e.stopPropagation()}
                className="text-gray-400 hover:text-[#F5A051] transition-colors p-1"
                aria-label={`${member.name}'s Twitter profile`}
              >
                <FaTwitter className="w-5 h-5" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SortableCategory = ({ role, isSelected, onClick, count }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `category-${role}`,
    data: {
      type: 'category',
      role
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 60 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 group
        ${isSelected
          ? "bg-[#F5A051] text-white shadow-md scale-105"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
        ${isDragging ? 'opacity-50 ring-2 ring-[#F5A051]' : ''}`}
    >
      <GripVertical className={`w-3 h-3 ${isSelected ? 'text-white/70' : 'text-gray-400'} group-hover:text-[#F5A051] transition-colors`} />
      {role} ({count})
    </div>
  );
};

const ConferenceCommittee = () => {
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [categories, setCategories] = useState<MemberRole[]>([...roleFilters])
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isOrderChanged, setIsOrderChanged] = useState(false)
  const [formData, setFormData] = useState<CommitteeMember>({
    name: '',
    role: 'Committee Members',
    affiliation: '',
    country: '',
    designation: '',
    links: {}
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsAdmin(user?.role === 'Admin');
    fetchCommitteeMembers();

    // Load saved category order
    const savedCategories = localStorage.getItem('committeeCategoryOrder');
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved category order", e);
      }
    }
  }, [user]);

  // Save category order when it changes
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('committeeCategoryOrder', JSON.stringify(categories));
    }
  }, [categories]);

  const fetchCommitteeMembers = async () => {
    try {
      setLoading(true);
      const isAdminUser = user?.role === 'Admin';
      const endpoint = isAdminUser
        ? '/api/committee/admin/all'
        : '/api/committee';

      const response = await api.get(endpoint);

      if (response.data.success) {
        setCommitteeMembers(response.data.data || response.data.members || []);
        setIsOrderChanged(false);
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
      Swal.fire({
        icon: 'info',
        title: 'Error',
        text: 'Failed to load committee members',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      role: 'Committee Members',
      affiliation: '',
      country: '',
      designation: '',
      links: {}
    });
    setEditingMember(null);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleEdit = (member: CommitteeMember) => {
    setFormData({ ...member });
    setEditingMember(member);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Committee Member?',
      text: `Are you sure you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/committee/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Committee member deleted successfully',
          confirmButtonColor: '#10b981',
        });
        fetchCommitteeMembers();
      } catch (error: any) {
        Swal.fire({
          icon: 'info',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete committee member',
          confirmButtonColor: '#dc2626',
        });
      }
    }
  };

  const handleSaveOrder = async () => {
    try {
      const orders = committeeMembers.map((member, index) => ({
        id: member._id,
        order: index
      }));

      await api.post('/api/committee/reorder', { orders });

      Swal.fire({
        icon: 'success',
        title: 'Order Saved!',
        text: 'Committee order updated successfully',
        confirmButtonColor: '#10b981',
        timer: 1500
      });
      setIsOrderChanged(false);
    } catch (error: any) {
      Swal.fire({
        icon: 'info',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save order',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleSave = async () => {
    try {
      const data = new FormData();

      (Object.keys(formData) as Array<keyof CommitteeMember>).forEach(key => {
        if (key === 'links') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (key !== '_id' && key !== 'image') {
          const value = formData[key];
          data.append(key, String(value || ''));
        }
      });

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingMember && editingMember._id) {
        await api.put(`/api/committee/${editingMember._id}`, data);
        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Member updated successfully', confirmButtonColor: '#10b981' });
      } else {
        await api.post('/api/committee', data);
        Swal.fire({ icon: 'success', title: 'Added!', text: 'Member added successfully', confirmButtonColor: '#10b981' });
      }

      setShowAddModal(false);
      fetchCommitteeMembers();
    } catch (error: any) {
      Swal.fire({ icon: 'info', title: 'Error', text: error.response?.data?.message || 'Failed to save', confirmButtonColor: '#dc2626' });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/api/committee/${id}/toggle-active`, {});
      Swal.fire({ icon: 'success', title: currentStatus ? 'Deactivated!' : 'Activated!', confirmButtonColor: '#10b981', timer: 1500 });
      fetchCommitteeMembers();
    } catch (error: any) {
      Swal.fire({ icon: 'info', title: 'Error', text: 'Failed to toggle status', confirmButtonColor: '#dc2626' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle Category Reordering
      if (activeData?.type === 'category') {
        setCategories((items) => {
          const oldIndex = items.indexOf(activeData.role);
          // Over item might be "category-all" or "category-RoleName"
          const overRole = overData?.role;
          const newIndex = overRole ? items.indexOf(overRole) : items.length - 1;

          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }
      // Handle Member Reordering
      else {
        setCommitteeMembers((items) => {
          const oldIndex = items.findIndex((item) => item._id === active.id);
          const newIndex = items.findIndex((item) => item._id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
        setIsOrderChanged(true);
      }
    }
  };

  const canReorder = isAdmin;
  const displayedMembers = selectedRole === "all" ? committeeMembers : committeeMembers.filter((m) => m.role === selectedRole);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4 text-center">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Committee</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              ICIUS 2026 Organizing Committee
            </p>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-[#F5A051] mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">Our Committee</h2>
            </div>
            <div className="flex gap-3">
              {isAdmin && isOrderChanged && (
                <button onClick={handleSaveOrder} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-shadow shadow-md">
                  <Save className="w-5 h-5 mr-2" /> Save Order
                </button>
              )}
              {isAdmin && (
                <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-[#e08c3e] shadow-md">
                  <Plus className="w-5 h-5 mr-2" /> Add Member
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Role:</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedRole("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedRole === "all" ? "bg-[#F5A051] text-white shadow-md scale-105" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                All ({committeeMembers.length})
              </button>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToWindowEdges]}
              >
                <SortableContext
                  items={categories.map(role => `category-${role}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="flex flex-wrap gap-3">
                    {categories.map((role) => (
                      <SortableCategory
                        key={role}
                        role={role}
                        isSelected={selectedRole === role}
                        onClick={() => setSelectedRole(role)}
                        count={committeeMembers.filter(m => m.role === role).length}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            {canReorder && (
              <p className="mt-3 text-sm text-blue-600 font-medium flex items-center">
                <GripVertical className="w-4 h-4 mr-1" /> Drag cards in any direction to reorder {selectedRole !== "all" ? `within ${selectedRole}` : ''}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051]"></div></div>
          ) : (
            <>
              {isAdmin && showAddModal && (
                <div className="mb-12 bg-white rounded-xl shadow-xl p-8 border-2 border-[#F5A051] animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">{editingMember ? 'Edit' : 'Add'} Member</h2>
                    <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Name *" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as MemberRole })} className="w-full px-4 py-2 border rounded-lg">
                      {roleFilters.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="text" placeholder="Affiliation *" value={formData.affiliation} onChange={e => setFormData({ ...formData, affiliation: e.target.value })} className="w-full px-4 py-2 border rounded-lg md:col-span-2" />
                    <input type="text" placeholder="Designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <input type="text" placeholder="Country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={handleSave} className="flex-1 py-3 bg-[#F5A051] text-white rounded-lg font-bold shadow-lg hover:bg-[#e08c3e]">Save Member</button>
                    <button onClick={() => setShowAddModal(false)} className="px-8 py-3 bg-gray-200 rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
                <SortableContext items={displayedMembers.map(m => m._id as string)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedMembers.map((member) => (
                      <SortableMemberCard
                        key={member._id}
                        member={member}
                        isAdmin={isAdmin}
                        canReorder={canReorder}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {displayedMembers.length === 0 && <p className="text-center py-10 text-gray-500">No members found.</p>}
            </>
          )}
        </main>
      </div>
    </PageTransition>
  )
}

export default ConferenceCommittee