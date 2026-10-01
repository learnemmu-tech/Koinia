"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { RequireWorkspaceAccess } from "@/components/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteTemplateGallery } from "@/components/website/website-template-gallery";
import { useActiveChurch } from "@/context/active-church-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { resolveEffectiveChurchId } from "@/lib/organization/resolve-effective-church";
import { useAllowTrialWrite } from "@/context/subscription-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { SOCIAL_PLATFORMS, WEBSITE_VISIBILITY_KEYS } from "@/lib/templates/types";
import type { AboutCopyItem } from "@/lib/templates/about-content";
import type {
  ChurchWebsiteConfig,
  SocialPlatform,
  TemplateImageSlot,
  TemplateManifest,
  WebsiteVisibilityKey,
} from "@/lib/templates/types";
import { adminSectionClass } from "@/lib/responsive-classes";

const IMAGE_FIELDS = [
  { key: "logoUrl", label: "Logo", slot: "logo" },
  { key: "faviconUrl", label: "Favicon", slot: "favicon" },
  { key: "heroImageUrl", label: "Hero image", slot: "hero" },
  { key: "aboutImageUrl", label: "About image", slot: "about" },
  { key: "featuredMinistryImageUrl", label: "Featured ministry image", slot: "featuredMinistry" },
  { key: "worshipImageUrl", label: "Worship image", slot: "worship" },
  { key: "socialPreviewImageUrl", label: "Social / OG image", slot: "socialPreview" },
] as const;

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
};

const VISIBILITY_LABELS: Record<WebsiteVisibilityKey, string> = {
  about: "About",
  sermons: "Sermons",
  events: "Events",
  ministries: "Ministries",
  articles: "Articles",
  videos: "Videos",
  giving: "Giving",
  contact: "Contact",
};

type WebsiteResponse = {
  website: ChurchWebsiteConfig;
  publicPath: string;
  templates?: TemplateManifest[];
  error?: string;
};

type BrandingDraft = {
  heroHeadline: string;
  heroSubheadline: string;
  serviceLabel: string;
  serviceTime: string;
  serviceLocation: string;
  scriptureReference: string;
  scriptureText: string;
  siteTitle: string;
  metaDescription: string;
  aboutHeadline: string;
  aboutIntro: string;
  aboutMission: string;
  aboutVision: string;
  aboutCommunity: string;
};

function emptySocialDraft(): Record<SocialPlatform, string> {
  return {
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    x: "",
  };
}

function socialFromWebsite(
  website: ChurchWebsiteConfig
): Record<SocialPlatform, string> {
  return {
    instagram: website.socialLinks.instagram ?? "",
    facebook: website.socialLinks.facebook ?? "",
    youtube: website.socialLinks.youtube ?? "",
    tiktok: website.socialLinks.tiktok ?? "",
    x: website.socialLinks.x ?? "",
  };
}

function brandingFromWebsite(website: ChurchWebsiteConfig): BrandingDraft {
  return {
    heroHeadline: website.heroHeadline ?? "",
    heroSubheadline: website.heroSubheadline ?? "",
    serviceLabel: website.serviceLabel ?? "",
    serviceTime: website.serviceTime ?? "",
    serviceLocation: website.serviceLocation ?? "",
    scriptureReference: website.scriptureReference ?? "",
    scriptureText: website.scriptureText ?? "",
    siteTitle: website.siteTitle ?? "",
    metaDescription: website.metaDescription ?? "",
    aboutHeadline: website.aboutHeadline ?? "",
    aboutIntro: website.aboutIntro ?? "",
    aboutMission: website.aboutMission ?? "",
    aboutVision: website.aboutVision ?? "",
    aboutCommunity: website.aboutCommunity ?? "",
  };
}

function imageUrlForSlot(
  website: ChurchWebsiteConfig,
  slot: TemplateImageSlot
): string | undefined {
  if (slot === "logo") return website.logoUrl ?? website.images.logo;
  if (slot === "favicon") return website.faviconUrl ?? website.images.favicon;
  if (slot === "socialPreview") {
    return website.images.socialPreview ?? website.ogImageUrl;
  }
  return website.images[slot];
}

async function getWebsiteSessionToken(getToken: () => Promise<string | null>) {
  return (
    (await getToken()) ??
    (await firebaseAuth.currentUser?.getIdToken()) ??
    null
  );
}

function AboutCopyListEditor({
  label,
  description,
  items,
  onChange,
  onSave,
  addLabel,
}: {
  label: string;
  description: string;
  items: AboutCopyItem[];
  onChange: (items: AboutCopyItem[]) => void;
  onSave: (items: AboutCopyItem[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="grid gap-2 rounded-md border p-3">
          <Input
            value={item.title}
            placeholder="Title"
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, title: event.target.value };
              onChange(next);
            }}
            onBlur={(event) => {
              const next = [...items];
              next[index] = { ...item, title: event.target.value };
              onSave(next);
            }}
          />
          <Textarea
            value={item.body}
            rows={3}
            placeholder="Description"
            onChange={(event) => {
              const next = [...items];
              next[index] = { ...item, body: event.target.value };
              onChange(next);
            }}
            onBlur={(event) => {
              const next = [...items];
              next[index] = { ...item, body: event.target.value };
              onSave(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-self-start"
            onClick={() => {
              const next = items.filter((_, itemIndex) => itemIndex !== index);
              onChange(next);
              onSave(next);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { title: "", body: "" }])}
      >
        {addLabel}
      </Button>
    </div>
  );
}

function WebsiteSettingsContent() {
  const { activeChurch, activeChurchId } = useActiveChurch();
  const { profile } = useFirebaseAuth();
  const { churches } = useOrganization();
  const resolvedChurchId = resolveEffectiveChurchId({
    profile,
    activeChurchId: activeChurch?.id ?? activeChurchId,
    orgChurches: churches,
  });
  const church =
    churches.find((item) => item.id === resolvedChurchId) ??
    activeChurch ??
    (churches.length === 1 ? churches[0] : null);
  const churchId = church?.id ?? null;
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const allowWrite = useAllowTrialWrite();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState<ChurchWebsiteConfig | null>(null);
  const [branding, setBranding] = useState<BrandingDraft | null>(null);
  const [templates, setTemplates] = useState<TemplateManifest[]>([]);
  const [publicPath, setPublicPath] = useState("");
  const [socialDraft, setSocialDraft] =
    useState<Record<SocialPlatform, string>>(emptySocialDraft);
  const [aboutValues, setAboutValues] = useState<AboutCopyItem[]>([]);
  const [aboutBeliefs, setAboutBeliefs] = useState<AboutCopyItem[]>([]);
  const loadedChurchId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!churchId || !isLoaded || !isSignedIn) {
        if (!churchId) setLoading(false);
        return;
      }
      if (loadedChurchId.current !== churchId) {
        loadedChurchId.current = churchId;
        setWebsite(null);
        setBranding(null);
        setLoading(true);
      }
      try {
        const token = await getWebsiteSessionToken(getToken);
        if (!token) return;
        const res = await fetch(`/api/churches/${churchId}/website`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as WebsiteResponse;
        if (!res.ok) throw new Error(data.error || "Failed to load website settings");
        if (cancelled) return;
        setWebsite(data.website);
        setBranding(brandingFromWebsite(data.website));
        setPublicPath(data.publicPath);
        setTemplates(data.templates ?? []);
        setSocialDraft(socialFromWebsite(data.website));
        setAboutValues(data.website.aboutValues ?? []);
        setAboutBeliefs(data.website.aboutBeliefs ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load website");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [churchId, getToken, isLoaded, isSignedIn]);

  function applyWebsite(next: ChurchWebsiteConfig, nextPublicPath?: string) {
    setWebsite(next);
    setBranding(brandingFromWebsite(next));
    setSocialDraft(socialFromWebsite(next));
    setAboutValues(next.aboutValues ?? []);
    setAboutBeliefs(next.aboutBeliefs ?? []);
    if (nextPublicPath) setPublicPath(nextPublicPath);
  }

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    if (!church) return false;
    if (!allowWrite({ action: "edit", resource: "church" })) return false;
    const token = await getWebsiteSessionToken(getToken);
    if (!token) return false;
    setSaving(true);
    try {
      const res = await fetch(`/api/churches/${church.id}/website`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as WebsiteResponse;
      if (!res.ok) throw new Error(data.error || "Failed to save");
      applyWebsite(data.website, data.publicPath);
      toast.success("Website settings saved");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveBrandingField(
    field: keyof BrandingDraft,
    value: string
  ) {
    if (!website || !branding) return;
    const persisted = brandingFromWebsite(website)[field];
    if (value === persisted) return;
    await patch({ [field]: value });
  }

  async function saveAboutList(
    field: "aboutValues" | "aboutBeliefs",
    items: AboutCopyItem[]
  ) {
    const next = items
      .map((item) => ({ title: item.title.trim(), body: item.body.trim() }))
      .filter((item) => item.title || item.body);
    const persisted =
      field === "aboutValues" ? website?.aboutValues ?? [] : website?.aboutBeliefs ?? [];
    if (JSON.stringify(next) === JSON.stringify(persisted)) return;
    await patch({ [field]: next });
  }

  async function uploadSlot(
    field: (typeof IMAGE_FIELDS)[number],
    file: File
  ) {
    if (!church) return;
    const token = await getWebsiteSessionToken(getToken);
    if (!token) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const replaceUrl = website
        ? imageUrlForSlot(website, field.slot)
        : undefined;
      const url = await uploadSongFileLocal(
        church.id,
        "cover",
        formData,
        undefined,
        token,
        {
          kind: "church-website",
          replaceUrl,
        }
      );
      await patch({ [field.key]: url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setSaving(false);
    }
  }

  if (!church) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a church to manage its public website.
      </p>
    );
  }

  if ((loading && !website) || !website || !branding) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="template" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="template">Template</TabsTrigger>
        <TabsTrigger value="branding">Branding & media</TabsTrigger>
        <TabsTrigger value="about">About page</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="visibility">Visibility</TabsTrigger>
      </TabsList>

      <TabsContent value="template" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Public website</CardTitle>
            <CardDescription>
              Changing templates only changes presentation. Church content, membership,
              and the public URL stay the same.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input readOnly value={publicPath} className="max-w-md" />
              <Button asChild variant="outline">
                <Link href={publicPath} target="_blank">
                  Open site
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {templates.length > 0 ? (
            <WebsiteTemplateGallery
              templates={templates}
              activeTemplate={website.activeTemplate}
              churchSlug={church.slug}
              saving={saving}
              onSelect={(templateId) => void patch({ activeTemplate: templateId })}
            />
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="branding" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>
              The template owns typography and layout. Your church owns identity, images,
              and copy fallbacks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="hero-headline">Hero headline</Label>
              <Textarea
                id="hero-headline"
                value={branding.heroHeadline}
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, heroHeadline: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("heroHeadline", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-sub">Supporting text</Label>
              <Textarea
                id="hero-sub"
                value={branding.heroSubheadline}
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, heroSubheadline: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("heroSubheadline", event.target.value)
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="service-label">Service label</Label>
                <Input
                  id="service-label"
                  value={branding.serviceLabel}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, serviceLabel: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("serviceLabel", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-time">Service time</Label>
                <Input
                  id="service-time"
                  value={branding.serviceTime}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, serviceTime: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("serviceTime", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-location">Service location</Label>
                <Input
                  id="service-location"
                  value={branding.serviceLocation}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, serviceLocation: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("serviceLocation", event.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scripture-ref">Scripture reference</Label>
                <Input
                  id="scripture-ref"
                  value={branding.scriptureReference}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, scriptureReference: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("scriptureReference", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scripture-text">Scripture text</Label>
                <Input
                  id="scripture-text"
                  value={branding.scriptureText}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, scriptureText: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("scriptureText", event.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Imagery</CardTitle>
            <CardDescription>Uses the existing church media storage.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {IMAGE_FIELDS.map((field) => {
              const current = imageUrlForSlot(website, field.slot);
              const compact = field.slot === "logo" || field.slot === "favicon";
              return (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  {current ? (
                    <div
                      className={
                        compact
                          ? "relative h-16 w-16 overflow-hidden rounded-md border bg-muted"
                          : "relative aspect-video overflow-hidden rounded-md border bg-muted"
                      }
                    >
                      <Image
                        src={current}
                        alt={`${field.label} preview`}
                        fill
                        className={compact ? "object-contain p-1" : "object-cover"}
                        sizes={compact ? "64px" : "(max-width: 768px) 100vw, 50vw"}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No image saved yet.</p>
                  )}
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadSlot(field, file);
                    }}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="about" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>About page</CardTitle>
            <CardDescription>
              This copy appears on the public About page for this church. Saved
              fields always take priority. Leave a field or list empty to show the
              public default, which you can replace at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="about-headline">Heading</Label>
              <Input
                id="about-headline"
                value={branding.aboutHeadline}
                placeholder={`About ${church.name}`}
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, aboutHeadline: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("aboutHeadline", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-intro">Introduction</Label>
              <Textarea
                id="about-intro"
                value={branding.aboutIntro}
                rows={5}
                placeholder="Public default uses the church name and a short welcome."
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, aboutIntro: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("aboutIntro", event.target.value)
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="about-mission">Mission</Label>
                <Textarea
                  id="about-mission"
                  value={branding.aboutMission}
                  rows={4}
                  placeholder="Public default: a short, editable mission for this church."
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, aboutMission: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("aboutMission", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about-vision">Vision</Label>
                <Textarea
                  id="about-vision"
                  value={branding.aboutVision}
                  rows={4}
                  onChange={(event) =>
                    setBranding((current) =>
                      current
                        ? { ...current, aboutVision: event.target.value }
                        : current
                    )
                  }
                  onBlur={(event) =>
                    void saveBrandingField("aboutVision", event.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-community">Community</Label>
              <Textarea
                id="about-community"
                value={branding.aboutCommunity}
                rows={4}
                placeholder="Public default: a short invitation to worship and connect."
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, aboutCommunity: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("aboutCommunity", event.target.value)
                }
              />
            </div>
            <AboutCopyListEditor
              label="Values"
              description="Card grid on the About page. Leave empty to use the public default values."
              items={aboutValues}
              onChange={setAboutValues}
              onSave={(items) => void saveAboutList("aboutValues", items)}
              addLabel="Add value"
            />
            <AboutCopyListEditor
              label="Beliefs"
              description="Shown as expandable sections. Leave empty for a default introduction — do not invent doctrine here unless it is your church's statement."
              items={aboutBeliefs}
              onChange={setAboutBeliefs}
              onSave={(items) => void saveAboutList("aboutBeliefs", items)}
              addLabel="Add belief"
            />
            {(() => {
              const aboutField = IMAGE_FIELDS.find((field) => field.slot === "about");
              if (!aboutField) return null;
              const current = imageUrlForSlot(website, aboutField.slot);
              return (
                <div className="space-y-2">
                  <Label>About image</Label>
                  {current ? (
                    <div className="relative aspect-video max-w-md overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={current}
                        alt="About image preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 28rem"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No image saved yet.</p>
                  )}
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadSlot(aboutField, file);
                    }}
                  />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="social">
        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
            <CardDescription>
              Only configured platforms appear on the public website. HTTPS URLs only.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="space-y-2">
                <Label htmlFor={`social-${platform}`}>{SOCIAL_LABELS[platform]}</Label>
                <Input
                  id={`social-${platform}`}
                  value={socialDraft[platform]}
                  placeholder="https://"
                  onChange={(event) =>
                    setSocialDraft((current) => ({
                      ...current,
                      [platform]: event.target.value,
                    }))
                  }
                  onBlur={() => {
                    const persisted = socialFromWebsite(website);
                    const unchanged = SOCIAL_PLATFORMS.every(
                      (item) => socialDraft[item] === persisted[item]
                    );
                    if (unchanged) return;
                    void patch({ socialLinks: socialDraft });
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-title">Site title</Label>
              <Input
                id="site-title"
                value={branding.siteTitle}
                onChange={(event) =>
                  setBranding((current) =>
                    current ? { ...current, siteTitle: event.target.value } : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("siteTitle", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta description</Label>
              <Textarea
                id="meta-description"
                value={branding.metaDescription}
                onChange={(event) =>
                  setBranding((current) =>
                    current
                      ? { ...current, metaDescription: event.target.value }
                      : current
                  )
                }
                onBlur={(event) =>
                  void saveBrandingField("metaDescription", event.target.value)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-3">
              <div>
                <p className="text-sm font-medium">Allow search indexing</p>
                <p className="text-sm text-muted-foreground">
                  Turn off to keep the public church website unlisted.
                </p>
              </div>
              <Switch
                checked={website.indexable}
                onCheckedChange={(checked) => void patch({ indexable: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="visibility">
        <Card>
          <CardHeader>
            <CardTitle>Public sections</CardTitle>
            <CardDescription>
              Hidden sections do not appear in navigation or the public website.
              Prayer requests are never public.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {WEBSITE_VISIBILITY_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-md border px-3 py-3"
              >
                <p className="text-sm font-medium">{VISIBILITY_LABELS[key]}</p>
                <Switch
                  checked={website.visibility[key]}
                  onCheckedChange={(checked) =>
                    void patch({
                      visibility: { ...website.visibility, [key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export function AdminWebsitePageClient() {
  return (
    <RequireWorkspaceAccess>
      <div className={adminSectionClass}>
        <AdminPageHeader
          title="Website"
          description="Choose a public church website template, branding, and SEO. Content records do not change."
        />
        <WebsiteSettingsContent />
      </div>
    </RequireWorkspaceAccess>
  );
}
