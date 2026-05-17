import { useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Camera } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  age: z.coerce.number().min(18, "Must be at least 18").max(100, "Invalid age").optional(),
  gender: z.string().optional(),
  avatarUrl: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-40 mx-auto mb-4" />
          <Skeleton className="h-6 w-56 mx-auto mb-2" />
          <Skeleton className="h-4 w-44 mx-auto" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function SetupProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");

  const { isLoading } = useGetMe();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", middleName: "", lastName: "", age: undefined, gender: "", avatarUrl: "", country: "", phone: "" },
  });

  const mutation = useUpdateProfile({
    mutation: {
      onSuccess: (data: any) => {
        updateUser(data);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/add-card");
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.data?.error || err?.message || "Failed to save profile", variant: "destructive" });
      },
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    form.setValue("avatarUrl", "");
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate({ data });
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-primary font-black text-2xl tracking-widest cursor-pointer">GOLDMAILER</span></Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm">Tell us a bit about yourself</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-testid="button-avatar-upload"
              className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden hover:border-primary transition-colors"
            >
              {preview ? (
                <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-primary/50" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <p className="text-xs text-muted-foreground mt-2">Add profile photo (optional)</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} placeholder="John" data-testid="input-first-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input {...field} placeholder="Doe" data-testid="input-last-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="middleName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl><Input {...field} placeholder="Optional" data-testid="input-middle-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                  <FormControl><Input {...field} type="tel" placeholder="+1 234 567 8900" data-testid="input-phone" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input {...field} type="number" placeholder="25" data-testid="input-age" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90 py-5 font-bold mt-4"
                disabled={mutation.isPending} data-testid="button-profile-submit">
                {mutation.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
