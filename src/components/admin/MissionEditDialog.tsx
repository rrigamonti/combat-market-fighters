import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Pencil } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Mission = Database["public"]["Tables"]["missions"]["Row"];

interface MissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: Mission;
}

const EVIDENCE_TYPE_OPTIONS = [
  { value: "screenshot", label: "Screenshot Upload" },
  { value: "photo", label: "Photo Upload" },
  { value: "video", label: "Video Upload" },
  { value: "link", label: "URL / Link" },
  { value: "receipt", label: "Receipt Upload" },
  { value: "text", label: "Text Description" },
];

export function MissionEditDialog({ open, onOpenChange, mission }: MissionEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    instructions: "",
    mission_type: "custom",
    assignment_mode: "hybrid",
    evidence_type: "",
    budget: "",
    reward_per_participant: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  });

  // Populate form when mission changes
  useEffect(() => {
    if (mission) {
      setForm({
        name: mission.name || "",
        description: mission.description || "",
        instructions: mission.instructions || "",
        mission_type: mission.mission_type || "custom",
        assignment_mode: mission.assignment_mode || "hybrid",
        evidence_type: mission.evidence_type || "",
        budget: mission.budget?.toString() || "",
        reward_per_participant: mission.reward_per_participant?.toString() || "",
        max_participants: mission.max_participants?.toString() || "",
        start_date: mission.start_date ? new Date(mission.start_date).toISOString().slice(0, 16) : "",
        end_date: mission.end_date ? new Date(mission.end_date).toISOString().slice(0, 16) : "",
      });
      setImagePreview(mission.image_url || null);
      setImageFile(null);
      setRemoveCurrentImage(false);
    }
  }, [mission, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveCurrentImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveCurrentImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      let image_url: string | null | undefined = undefined;

      // Upload new image
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
      } else if (removeCurrentImage) {
        image_url = null;
      }

      const updatePayload: Record<string, any> = {
        name: values.name,
        description: values.description || null,
        instructions: values.instructions || null,
        mission_type: values.mission_type as any,
        assignment_mode: values.assignment_mode,
        evidence_type: values.evidence_type ? (values.evidence_type as any) : null,
        budget: values.budget ? parseFloat(values.budget) : null,
        reward_per_participant: values.reward_per_participant ? parseFloat(values.reward_per_participant) : null,
        max_participants: values.max_participants ? parseInt(values.max_participants) : null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
      };

      if (image_url !== undefined) {
        updatePayload.image_url = image_url;
      }

      const { error } = await supabase
        .from("missions")
        .update(updatePayload)
        .eq("id", mission.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mission", mission.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
      onOpenChange(false);
      toast({ title: "Mission updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Edit Mission
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
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
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
          <Button type="submit" className="w-full" disabled={updateMutation.isPending || !form.name}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
