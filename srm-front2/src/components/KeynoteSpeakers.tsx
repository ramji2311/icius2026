import React, { useState, useEffect } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import {
  Scroll,
  Globe,
  Mail,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  GripVertical
} from 'lucide-react';
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

// Import local images as fallback placeholders
import MahmoudShafikImage from "./images/speaker/n.png"
import KazuoIshiiImage from "./images/new/kazuo4.jpeg"
import DugkiMinImage from "./images/new/dugki.jpg"
import YaoZouImage from "./images/new/zou.gif"

interface Speaker {
  _id?: string;
  name: string;
  title: string;
  institution: string;
  image?: string;
  email?: string;
  facultyProfile?: string;
  linkedIn?: string;
  orcid?: string;
  biography: string;
  expertise: string[];
  keynoteTitle: string;
  keynoteDescription: string;
  order?: number;
  active?: boolean;
}

const resolveSpeakerImage = (img: string | undefined, speakerName: string) => {
  if (!img) return `https://ui-avatars.com/api/?name=${encodeURIComponent(speakerName)}&background=F5A051&color=fff&size=300`;
  if (img.includes('/speaker/n.png')) return MahmoudShafikImage;
  if (img.includes('/kazuo4.jpeg')) return KazuoIshiiImage;
  if (img.includes('/dugki.jpg')) return DugkiMinImage;
  if (img.includes('/zou.gif')) return YaoZouImage;
  return img;
};

// Sortable Speaker Card Component
const SortableSpeakerCard = ({
  speaker,
  isAdmin,
  onEdit,
  onDelete,
  onToggleActive,
  onViewProfile,
  isExpanded
}: {
  speaker: Speaker;
  isAdmin: boolean;
  onEdit: (s: Speaker) => void;
  onDelete: (id: string, name: string) => void;
  onToggleActive: (id: string) => void;
  onViewProfile: (id: string) => void;
  isExpanded: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: speaker._id || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`speaker-${speaker._id}`}
      className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 transform
        ${isAdmin && !speaker.active ? 'opacity-50 border-2 border-red-300' : 'border-2 border-transparent'}
        ${isDragging ? 'shadow-2xl ring-4 ring-[#F5A051]/50 scale-105 z-50 cursor-grabbing' : 'hover:-translate-y-2 hover:shadow-2xl'}`}
    >
      {/* Drag handle (Admins only) */}
      {isAdmin && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 left-3 bg-black/60 text-white p-2 rounded-full z-20 cursor-grab hover:bg-[#F5A051] transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Admin Action Buttons */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(speaker); }}
            className="bg-black/60 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            title="Edit Speaker"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); speaker._id && onDelete(speaker._id, speaker.name); }}
            className="bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            title="Delete Speaker"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={resolveSpeakerImage(speaker.image, speaker.name)}
          alt={speaker.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=F5A051&color=fff&size=300`;
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

        {/* Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-lg font-bold mb-1 line-clamp-2">
            {speaker.name.includes('*') ? (
              <>
                {speaker.name.replace('*', '')}
                <span className="text-orange-500 text-2xl font-black ml-1 leading-none align-middle">*</span>
              </>
            ) : (
              speaker.name
            )}
          </h3>
          <p className="text-xs opacity-90 mb-1">{speaker.title}</p>
          <p className="text-[10px] opacity-75 leading-tight">{speaker.institution}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gradient-to-br from-blue-900 to-[#F5A051] flex flex-col gap-2">
        <button
          onClick={() => speaker._id && onViewProfile(speaker._id)}
          className="w-full bg-white text-blue-900 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2 text-sm"
        >
          {isExpanded ? (
            <>
              Hide Profile
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View Profile
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {isAdmin && speaker._id && (
          <button
            onClick={() => onToggleActive(speaker._id!)}
            className={`w-full text-white font-medium py-1 px-4 rounded text-xs transition-colors ${speaker.active ? 'bg-green-600/80 hover:bg-green-600' : 'bg-red-600/80 hover:bg-red-600'}`}
          >
            Status: {speaker.active ? 'Active' : 'Inactive'}
          </button>
        )}
      </div>
    </div>
  );
};

const KeynoteSpeakers = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [expandedSpeaker, setExpandedSpeaker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Admin Form Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [formData, setFormData] = useState<Omit<Speaker, '_id' | 'image'>>({
    name: '',
    title: '',
    institution: '',
    email: '',
    facultyProfile: '',
    linkedIn: '',
    orcid: '',
    biography: '',
    expertise: [],
    keynoteTitle: '',
    keynoteDescription: '',
    order: 0,
    active: true
  });

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
    fetchSpeakers();
  }, [user]);

  const fetchSpeakers = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/api/keynote-speakers/admin/all' : '/api/keynote-speakers';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setSpeakers(response.data.speakers || []);
        setIsOrderChanged(false);
      }
    } catch (error) {
      console.error('Error fetching keynote speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      title: '',
      institution: '',
      email: '',
      facultyProfile: '',
      linkedIn: '',
      orcid: '',
      biography: '',
      expertise: [],
      keynoteTitle: '',
      keynoteDescription: '',
      order: speakers.length,
      active: true
    });
    setExpertiseInput('');
    setEditingSpeaker(null);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleEdit = (speaker: Speaker) => {
    setFormData({
      name: speaker.name,
      title: speaker.title || '',
      institution: speaker.institution,
      email: speaker.email || '',
      facultyProfile: speaker.facultyProfile || '',
      linkedIn: speaker.linkedIn || '',
      orcid: speaker.orcid || '',
      biography: speaker.biography,
      expertise: speaker.expertise || [],
      keynoteTitle: speaker.keynoteTitle,
      keynoteDescription: speaker.keynoteDescription,
      order: speaker.order || 0,
      active: speaker.active !== undefined ? speaker.active : true
    });
    setExpertiseInput(speaker.expertise ? speaker.expertise.join(', ') : '');
    setEditingSpeaker(speaker);
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Keynote Speaker?',
      text: `Are you sure you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/keynote-speakers/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Speaker deleted successfully',
          confirmButtonColor: '#10b981',
          timer: 1500
        });
        fetchSpeakers();
        if (expandedSpeaker === id) {
          setExpandedSpeaker(null);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete speaker',
          confirmButtonColor: '#dc2626',
        });
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/api/keynote-speakers/${id}/toggle-active`);
      fetchSpeakers();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to toggle status',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      const parsedExpertise = expertiseInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        expertise: parsedExpertise
      };

      (Object.keys(payload) as Array<keyof typeof payload>).forEach(key => {
        if (key === 'expertise') {
          data.append('expertise', JSON.stringify(payload.expertise));
        } else {
          const val = payload[key];
          if (val !== undefined && val !== null) {
            data.append(key, String(val));
          }
        }
      });

      if (imageFile) {
        data.append('image', imageFile);
      }

      let response;
      if (editingSpeaker?._id) {
        response = await api.put(`/api/keynote-speakers/${editingSpeaker._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/api/keynote-speakers', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Speaker ${editingSpeaker ? 'updated' : 'added'} successfully`,
          confirmButtonColor: '#10b981',
          timer: 1500
        });
        setShowAddModal(false);
        fetchSpeakers();
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save speaker',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      const orders = speakers.map((speaker, index) => ({
        id: speaker._id,
        order: index
      }));

      await api.post('/api/keynote-speakers/reorder', { orders });

      Swal.fire({
        icon: 'success',
        title: 'Order Saved!',
        text: 'Speakers order updated successfully',
        confirmButtonColor: '#10b981',
        timer: 1500
      });
      setIsOrderChanged(false);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save order',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSpeakers((prevItems) => {
      const oldIndex = prevItems.findIndex((item) => item._id === active.id);
      const newIndex = prevItems.findIndex((item) => item._id === over.id);
      const newOrder = arrayMove(prevItems, oldIndex, newIndex);
      setIsOrderChanged(true);
      return newOrder;
    });
  };

  const toggleSpeaker = (id: string) => {
    if (expandedSpeaker === id) {
      setExpandedSpeaker(null);
    } else {
      setExpandedSpeaker(id);
      setTimeout(() => {
        const element = document.getElementById(`profile-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-10 sm:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center justify-center">
                <Scroll className="w-12 h-12 mr-4 animate-pulse" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center sm:text-left">Keynote Speakers</h1>
              </div>
              
              {isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAddNew}
                    className="bg-white text-blue-900 font-semibold px-4 py-2.5 rounded-lg shadow-md hover:bg-gray-100 transition-all flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Speaker
                  </button>

                  {isOrderChanged && (
                    <button
                      onClick={handleSaveOrder}
                      className="bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" /> Save Order
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto text-center mt-6">
              Distinguished experts sharing insights at ICIUS 2026
            </p>
          </div>
        </header>

        <main className="container mx-auto py-8 sm:py-16 px-4">
          {/* Introduction */}
          <div className="max-w-5xl mx-auto mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">Meet Our Featured Speakers</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We are honored to present our distinguished keynote speakers for ICIUS 2026. These renowned experts
              will share their valuable insights and cutting-edge research across intelligent systems and multidisciplinary domains.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5A051] border-t-transparent mb-4"></div>
              <p className="text-gray-500">Loading keynote speakers...</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={speakers.map(s => s._id || '')}
                strategy={rectSortingStrategy}
              >
                <div className="max-w-7xl mx-auto mb-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {speakers.map((speaker) => (
                      <SortableSpeakerCard
                        key={speaker._id}
                        speaker={speaker}
                        isAdmin={isAdmin}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                        onViewProfile={toggleSpeaker}
                        isExpanded={expandedSpeaker === speaker._id}
                      />
                    ))}
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Expanded Profile Section */}
          {expandedSpeaker !== null && (
            <div id={`profile-${expandedSpeaker}`} className="max-w-7xl mx-auto animate-slideDown mb-8">
              {speakers
                .filter((speaker) => speaker._id === expandedSpeaker)
                .map((speaker) => (
                  <div
                    key={speaker._id}
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                  >
                    {/* Profile Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                      {/* Left Column - Speaker Photo */}
                      <div className="lg:col-span-3 bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 flex flex-col items-center justify-start">
                        <img
                          src={resolveSpeakerImage(speaker.image, speaker.name)}
                          alt={speaker.name}
                          className="w-48 h-48 object-cover rounded-xl shadow-xl border-4 border-white mb-6"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=F5A051&color=fff&size=200`;
                          }}
                        />
                      </div>

                      {/* Right Column - Speaker Details */}
                      <div className="lg:col-span-9 p-4 sm:p-8 lg:p-12">
                        {/* Header */}
                        <div className="mb-8">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            {speaker.name.includes('*') ? (
                              <>
                                {speaker.name.replace('*', '')}
                                <span className="text-orange-500 text-5xl font-black ml-1 leading-none align-middle">*</span>
                              </>
                            ) : (
                              speaker.name
                            )}
                          </h2>
                          <p className="text-xl text-[#F5A051] font-semibold mb-1">{speaker.title}</p>
                          <p className="text-lg text-gray-600 mb-4">{speaker.institution}</p>

                          {/* Contact Links */}
                          <div className="flex flex-wrap gap-4 mb-6">
                            {speaker.email && (
                              <a
                                href={`mailto:${speaker.email}`}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{speaker.email}</span>
                              </a>
                            )}
                            {speaker.facultyProfile && (
                              <a
                                href={speaker.facultyProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm">Faculty Profile</span>
                              </a>
                            )}
                            {speaker.linkedIn && (
                              <a
                                href={speaker.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                                <span className="text-sm">LinkedIn Profile</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Biography Section */}
                        <section className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-[#F5A051]" />
                            <h3 className="text-2xl font-bold text-gray-800">Biography</h3>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-justify">
                            {speaker.biography}
                          </p>
                        </section>

                        {/* Areas of Expertise */}
                        {speaker.expertise && speaker.expertise.length > 0 && (
                          <section className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                              <Award className="w-5 h-5 text-[#F5A051]" />
                              <h3 className="text-2xl font-bold text-gray-800">Areas of Expertise</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {speaker.expertise.map((area, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-200 transition-colors"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Keynote Presentation */}
                        <section className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-l-4 border-[#F5A051]">
                          <div className="flex items-center gap-2 mb-4">
                            <Scroll className="w-5 h-5 text-[#F5A051]" />
                            <h3 className="text-2xl font-bold text-gray-800">Keynote Presentation</h3>
                          </div>
                          <h4 className="text-xl font-bold text-[#F5A051] mb-3">
                            {speaker.keynoteTitle}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {speaker.keynoteDescription}
                          </p>
                        </section>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>

        {/* Modal for Add / Edit Speaker */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingSpeaker ? 'Edit Keynote Speaker' : 'Add New Keynote Speaker'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title (Credentials)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. BEng (Hons) MSc PhD CEng"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Institution */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Institution / Affiliation *</label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Department of Computer Science • University of Oxford, UK"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. jane.doe@ox.ac.uk"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Faculty Profile */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Faculty Profile URL</label>
                    <input
                      type="url"
                      value={formData.facultyProfile}
                      onChange={(e) => setFormData({ ...formData, facultyProfile: e.target.value })}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* ORCID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ORCID iD</label>
                    <input
                      type="text"
                      value={formData.orcid}
                      onChange={(e) => setFormData({ ...formData, orcid: e.target.value })}
                      placeholder="e.g. 0000-0002-1825-0097"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Speaker Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                    {editingSpeaker?.image && !imageFile && (
                      <p className="text-xs text-gray-500 mt-1">Current image: {editingSpeaker.image}</p>
                    )}
                  </div>

                  {/* Biography */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Biography *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.biography}
                      onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                      placeholder="Enter detailed speaker biography..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none resize-y"
                    />
                  </div>

                  {/* Expertise */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Areas of Expertise (Comma-separated)</label>
                    <input
                      type="text"
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      placeholder="e.g. Artificial Intelligence, Machine Vision, Smart Sensors"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Keynote Presentation Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keynote Presentation Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.keynoteTitle}
                      onChange={(e) => setFormData({ ...formData, keynoteTitle: e.target.value })}
                      placeholder="e.g. Advanced Autonomous Control Systems..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none"
                    />
                  </div>

                  {/* Keynote Presentation Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keynote Presentation Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.keynoteDescription}
                      onChange={(e) => setFormData({ ...formData, keynoteDescription: e.target.value })}
                      placeholder="Enter keynote presentation abstract or description..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#F5A051]/50 focus:border-[#F5A051] outline-none resize-y"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="h-5 w-5 text-[#F5A051] focus:ring-[#F5A051] border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Show on public site (Active)
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-[#F5A051] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-slideDown {
            animation: slideDown 0.5s ease-out;
          }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default KeynoteSpeakers;
