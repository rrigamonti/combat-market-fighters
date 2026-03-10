import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, X } from "lucide-react";

interface MissionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVIDENCE_TYPE_OPTIONS = [
  { value: "screenshot", label: "Screenshot Upload" },
  { value: "photo", label: "Photo Upload" },
  { value: "video", label: "Video Upload" },
  { value: "link", label: "URL / Link" },
  { value: "receipt", label: "Receipt Upload" },
  { value: "text", label: "Text Description" },
];

export function MissionCreateDialog({ open, onOpenChange }: MissionCreateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    instructions: "",
    merchant_id: "",
    mission_type: "custom",
    assignment_mode: "hybrid",
    evidence_type: "",
    budget: "",
    reward_per_participant: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ["admin-merchants-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchants")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      let image_url: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `missions/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("mission-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("mission-images")
          .getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("missions").insert({
        name: values.name,
        description: values.description || null,
        instructions: values.instructions || null,
        merchant_id: values.merchant_id,
        mission_type: values.mission_type as any,
        assignment_mode: values.assignment_mode,
        evidence_type: values.evidence_type ? (values.evidence_type as any) : null,
        budget: values.budget ? parseFloat(values.budget) : null,
        reward_per_participant: values.reward_per_participant ? parseFloat(values.reward_per_participant) : null,
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        created_by: user?.id,
        status: "draft" as const,
        image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
      onOpenChange(false);
      resetForm();
      toast({ title: "Mission created as draft" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({
      name: "", description: "", instructions: "", merchant_id: "",
      mission_type: "custom", assignment_mode: "hybrid", evidence_type: "",
      budget: "", reward_per_participant: "", max_participants: "",
      start_date: "", end_date: "",
    });
    removeImage();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Mission</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label>Mission Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Click to upload an image</span>
              </button>
            )}
          </div>

          <div>
            <Label>Merchant *</Label>
            <Select value={form.merchant_id} onValueChange={(v) => setForm({ ...form, merchant_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select merchant" /></SelectTrigger>
              <SelectContent>
                {merchants.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mission Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Instructions for fighters</Label>
            <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What should fighters do?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mission Type</Label>
              <Select value={form.mission_type} onValueChange={(v) => setForm({ ...form, mission_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proof Method</Label>
              <Select value={form.evidence_type} onValueChange={(v) => setForm({ ...form, evidence_type: v })}>
                <SelectTrigger><SelectValue placeholder="How fighters prove completion" /></SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assignment Mode</Label>
            <Select value={form.assignment_mode} onValueChange={(v) => setForm({ ...form, assignment_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Admin assigns only</SelectItem>
                <SelectItem value="open">Open for all fighters</SelectItem>
                <SelectItem value="hybrid">Hybrid (assign + open)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Budget ($)</Label>
              <Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <Label>Reward/Fighter ($)</Label>
              <Input type="number" step="0.01" value={form.reward_per_participant} onChange={(e) => setForm({ ...form, reward_per_participant: e.target.value })} />
            </div>
            <div>
              <Label>Max Fighters</Label>
              <Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.merchant_id || !form.name}>
            {createMutation.isPending ? "Creating..." : "Create Mission (Draft)"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
