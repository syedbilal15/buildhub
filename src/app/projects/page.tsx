"use client";

import { useEffect, useState, useCallback, startTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Building2,
  Layers,
  MapPin,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea";
import Modal from "@/components/Modal";
import SearchInput from "@/components/SearchInput";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ProjectWithCount {
  project: {
    id: number;
    name: string;
    projectCode: string | null;
    location: string | null;
    description: string | null;
    status: string;
    createdAt: string;
  };
  unitCount: number;
}

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const emptyForm = { name: "", projectCode: "", location: "", description: "", status: "active" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithCount["project"] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchProjects = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/projects?${params}`);
    setProjects(await res.json());
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { startTransition(() => fetchProjects()); }, [fetchProjects]);

  const openAddForm = async () => {
    setEditingProject(null);
    setForm(emptyForm);
    setSelectedFiles([]);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = async (item: ProjectWithCount) => {
    setEditingProject(item.project);
    setForm({
      name: item.project.name,
      projectCode: item.project.projectCode || "",
      location: item.project.location || "",
      description: item.project.description || "",
      status: item.project.status,
    });
    setSelectedFiles([]);
    setShowForm(true);
  };

  const uploadProjectFiles = async (projectId: number) => {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to upload files");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = { ...form };
      const res = editingProject
        ? await fetch(`/api/projects/${editingProject.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to save project");
        return;
      }

      const projectData = await res.json();
      if (selectedFiles.length > 0) {
        try {
          await uploadProjectFiles(projectData.id);
        } catch (uploadError: any) {
          setFormError(uploadError.message || "File upload failed");
          return;
        }
      }

      setShowForm(false);
      setSelectedFiles([]);
      setToast({
        message: editingProject ? "Project updated successfully" : `Project "${form.name}" created`,
        type: "success",
      });
      fetchProjects();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/projects/${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed to delete"); return; }
      setDeleteId(null);
      setToast({ message: "Project deleted", type: "success" });
      fetchProjects();
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const containerVariants: any = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
  const itemVariants: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  if (loading) return <Spinner />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your property projects</p>
        </div>
        <Button onClick={openAddForm}><Plus size={16} /> Add New Project</Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUSES}
          placeholder="All Statuses"
          className="sm:w-44"
        />
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
            <Building2 size={36} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No projects found</p>
          <p className="mt-1 text-xs text-slate-400">
            {search || statusFilter ? "Try adjusting your filters" : "Add your first project to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((item) => (
            <motion.div key={item.project.id} variants={itemVariants} className="card-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm" whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {item.project.projectCode || "Project"}
                  </p>
                  <h3 className="truncate text-base font-semibold text-slate-900">{item.project.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{item.project.location || "No location"}</p>
                </div>
                <Badge>{item.project.status}</Badge>
              </div>

              <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-400 shrink-0" />
                  <span>{item.unitCount} unit{item.unitCount !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{item.project.location || "Location not set"}</span>
                </div>
                {item.project.description && (
                  <div className="col-span-full text-sm text-slate-500 line-clamp-2">
                    {item.project.description}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/projects/${item.project.id}`}>
                  <Button variant="outline" size="sm"><Eye size={14} /> View Details</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => openEditForm(item)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDeleteId(item.project.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingProject ? "Edit Project" : "Add New Project"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Project Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Build Hub Garden Estate" />
            <Input label="Project Code" value={form.projectCode} onChange={(e) => setForm({ ...form, projectCode: e.target.value })} placeholder="e.g., AHG-001" />
          </div>
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Phase 7, Gulshan-e-Maymar, Karachi" />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUSES} />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g., A premium gated community with lush green parks..." />
          <Input
            label="Project Files"
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
            helperText="Upload images or PDF documents from your computer"
          />
          {selectedFiles.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Selected files</p>
              <ul className="mt-2 list-disc pl-5">
                {selectedFiles.map((file) => (
                  <li key={file.name + file.size}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <span className="text-red-500">&#9888;</span> {formError}
            </div>
          )}
              <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editingProject ? "Update Project" : "Save Project"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Project?"
        message="This action cannot be undone. All units and associated data will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteId(null); setDeleteError(""); }}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </motion.div>
  );
}
