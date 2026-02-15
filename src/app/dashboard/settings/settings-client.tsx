"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

interface Profile {
  name: string;
  age: number | null;
  sex: string | null;
  height: string | null;
  weight: string | null;
  lifestyle: string | null;
}

interface HealthHistory {
  id: string;
  medications: string[];
  allergies: string[];
  current_conditions: string[];
  surgeries: string[];
}

export default function SettingsClient({
  profile,
  healthHistory,
  email,
}: {
  profile: Profile | null;
  healthHistory: HealthHistory | null;
  email: string;
}) {
  const [name, setName] = useState(profile?.name || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [sex, setSex] = useState(profile?.sex || "");
  const [height, setHeight] = useState(profile?.height || "");
  const [weight, setWeight] = useState(profile?.weight || "");
  const [lifestyle, setLifestyle] = useState(profile?.lifestyle || "");
  const [medications, setMedications] = useState(
    healthHistory?.medications?.join(", ") || ""
  );
  const [allergies, setAllergies] = useState(
    healthHistory?.allergies?.join(", ") || ""
  );
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileError } = await supabase
        .from("users")
        .update({
          name,
          age: age ? parseInt(age) : null,
          sex,
          height,
          weight,
          lifestyle,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (healthHistory) {
        const { error: healthError } = await supabase
          .from("health_history")
          .update({
            medications: medications
              ? medications.split(",").map((s) => s.trim())
              : [],
            allergies: allergies
              ? allergies.split(",").map((s) => s.trim())
              : [],
          })
          .eq("id", healthHistory.id);

        if (healthError) throw healthError;
      }

      toast.success("Settings saved");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and health information
        </p>
      </div>

      {/* Profile */}
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Age</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Biological Sex</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="intersex">Intersex</SelectItem>
                <SelectItem value="prefer-not-to-say">
                  Prefer not to say
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Lifestyle</Label>
          <Select value={lifestyle} onValueChange={setLifestyle}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="sedentary">Sedentary</SelectItem>
              <SelectItem value="smoker">Smoker</SelectItem>
              <SelectItem value="social-drinker">Social Drinker</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Health Info */}
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Health Information</h2>
        <div className="space-y-2">
          <Label>Medications (comma separated)</Label>
          <Input
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder="e.g. Metformin, Lisinopril"
          />
        </div>
        <div className="space-y-2">
          <Label>Allergies (comma separated)</Label>
          <Input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="e.g. Penicillin, Shellfish"
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>

      {/* Privacy */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Privacy & Data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your data is encrypted and stored securely. We comply with GDPR
              regulations. You can request a full export or deletion of your data
              at any time by contacting support.
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="outline" size="sm">
                Export My Data
              </Button>
              <Button variant="outline" size="sm" className="text-destructive">
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
