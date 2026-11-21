"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  addSitePhoto,
  deleteSitePhoto,
  importBuiltInPhotos,
  moveSitePhoto,
  saveSiteTexts,
  updateSitePhoto,
} from "@/lib/actions/website";
import { collectionIds, collections, type CollectionId } from "@/content/collections";
import { CollectionEditor, type AdminItem } from "./CollectionEditor";
import { uploadImage } from "./media";
import {
  englishDefault,
  photoSections,
  storageKey,
  textFields,
  textGroups,
  type Locale,
  type PhotoSection,
  type TextField,
} from "@/content/site-texts";

export interface AdminPhoto {
  id: string;
  section: PhotoSection;
  url: string;
  title: string;
  caption: string;
  width: number;
  height: number;
  isVisible: boolean;
}

type Notice = { kind: "ok" | "error"; text: string } | null;

const builtInText = (locale: Locale, field: TextField) => (locale === "en" ? englishDefault(field) : field.default);

const fieldClasses =
  "w-full rounded-lg border border-border bg-panel-raised px-3 py-2 font-body text-[13.5px] text-text-hi outline-none placeholder:text-text-faint";

export function WebsiteClient({
  overrides,
  photos,
  items,
  mediaBase,
  setupNeeded,
}: {
  overrides: Record<string, string>;
  photos: AdminPhoto[];
  items: AdminItem[];
  /** Public URL prefix of the storage bucket. */
  mediaBase: string;
  setupNeeded: boolean;
}) {
  const [tab, setTab] = useState<"texts" | "photos" | CollectionId>("texts");

  return (
    <div className="px-7 py-6">
      <PageHeader
        title="เว็บไซต์"
        subtitle="แก้ข้อความ ภาพ คลิป วิธีเล่นเครื่อง บทความ และสินค้าบนหน้าเว็บ บันทึกแล้วหน้าเว็บจะเปลี่ยนทันที"
        action={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2 font-body text-[13.5px] font-semibold text-text-hi hover:bg-white/5"
          >
            <ExternalLink size={15} /> เปิดหน้าเว็บ
          </a>
        }
      />

      {setupNeeded && (
        <Card className="mb-4 border-amber bg-amber-bg">
          <p className="font-body text-[13.5px] leading-relaxed text-text-hi">
            ยังใช้งานหน้านี้ไม่ได้ เพราะฐานข้อมูลยังไม่มีตารางของหน้าเว็บ ให้เปิด Supabase ไปที่ SQL Editor
            แล้วรันไฟล์ <code className="font-mono">supabase/website-cms.sql</code> หนึ่งครั้ง จากนั้นโหลดหน้านี้ใหม่
          </p>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["texts", "ข้อความ"],
            ["photos", "ภาพ"],
            ...collectionIds.map((id) => [id, collections[id].tab] as const),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              "cursor-pointer rounded-lg px-4 py-2 font-body text-sm font-semibold",
              tab === id ? "bg-volt/10 text-volt" : "text-text-lo hover:text-text-hi"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "texts" ? (
        <TextsTab overrides={overrides} disabled={setupNeeded} />
      ) : tab === "photos" ? (
        <PhotosTab photos={photos} disabled={setupNeeded} />
      ) : (
        <CollectionEditor
          key={tab}
          def={collections[tab]}
          items={items.filter((item) => item.collection === tab)}
          mediaBase={mediaBase}
          disabled={setupNeeded}
        />
      )}
    </div>
  );
}

function TextsTab({ overrides, disabled }: { overrides: Record<string, string>; disabled: boolean }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("th");
  // One set of form values per language, so switching tabs keeps unsaved edits.
  const [values, setValues] = useState<Record<Locale, Record<string, string>>>(() => {
    const initial = (language: Locale) =>
      Object.fromEntries(
        textFields.map((field) => [field.key, overrides[storageKey(language, field.key)] ?? builtInText(language, field)])
      );
    return { th: initial("th"), en: initial("en") };
  });
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    setValues((current) => ({ ...current, [locale]: { ...current[locale], [key]: value } }));
    setNotice(null);
  };

  const save = () => {
    const formData = new FormData();
    formData.set("locale", locale);
    for (const field of textFields) formData.set(field.key, values[locale][field.key] ?? "");
    startTransition(async () => {
      const result = await saveSiteTexts(formData);
      if ("error" in result) setNotice({ kind: "error", text: result.error });
      else {
        setNotice({
          kind: "ok",
          text: locale === "th" ? "บันทึกแล้ว หน้าเว็บภาษาไทยอัปเดตเรียบร้อย" : "บันทึกแล้ว หน้าเว็บภาษาอังกฤษอัปเดตเรียบร้อย",
        });
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="ภาษาที่กำลังแก้" className="flex rounded-lg border border-border p-1">
          {(
            [
              ["th", "ภาษาไทย"],
              ["en", "English"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setLocale(id);
                setNotice(null);
              }}
              className={clsx(
                "cursor-pointer rounded-md px-3.5 py-1.5 font-body text-[13px] font-semibold",
                locale === id ? "bg-volt text-volt-ink" : "text-text-lo hover:text-text-hi"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-body text-[12.5px] text-text-faint">
          {locale === "th"
            ? "ข้อความของหน้าเว็บภาษาไทย"
            : "ข้อความของหน้าเว็บภาษาอังกฤษ (/en) เบอร์โทร LINE ลิงก์ และตำแหน่งแผนที่ใช้ค่าเดียวกับภาษาไทย แก้ที่แท็บภาษาไทย"}
        </p>
      </div>

      {textGroups.map((group) => {
        const fields = textFields.filter(
          (field) => field.group === group.id && !(locale === "en" && "shared" in field && field.shared)
        );
        if (fields.length === 0) return null;
        return (
          <Card key={group.id}>
            <h2 className="mb-3.5 font-body text-[15px] font-semibold text-text-hi">{group.title}</h2>
            <div className="space-y-4">
              {fields.map((field) => {
                const id = `${locale}-${field.key}`;
                const builtIn = builtInText(locale, field);
                const value = values[locale][field.key] ?? "";
                const edited = value !== builtIn;
                const multiline = "multiline" in field && field.multiline;
                return (
                  <div key={id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label htmlFor={id} className="font-body text-[13px] font-medium text-text-lo">
                        {field.label}
                        {edited && <span className="ml-2 text-[11.5px] font-semibold text-volt">แก้ไขแล้ว</span>}
                      </label>
                      {edited && (
                        <button
                          type="button"
                          onClick={() => set(field.key, builtIn)}
                          className="inline-flex cursor-pointer items-center gap-1 font-body text-[12px] text-text-faint hover:text-text-hi"
                        >
                          <RotateCcw size={12} /> คืนค่าเดิม
                        </button>
                      )}
                    </div>
                    {multiline ? (
                      <textarea
                        id={id}
                        rows={field.key === "ticker.items" ? 5 : 3}
                        value={value}
                        disabled={disabled}
                        onChange={(event) => set(field.key, event.target.value)}
                        className={clsx(fieldClasses, "resize-y leading-relaxed")}
                      />
                    ) : (
                      <Input id={id} value={value} disabled={disabled} onChange={(event) => set(field.key, event.target.value)} />
                    )}
                    {"help" in field && field.help && (
                      <p className="mt-1.5 font-body text-[12px] text-text-faint">{field.help}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      <div className="fixed bottom-0 left-56 right-0 flex items-center gap-4 border-t border-border bg-base/95 px-7 py-3.5 backdrop-blur">
        <Button variant="primary" onClick={save} disabled={pending || disabled} className="px-6 py-2.5">
          {pending ? "กำลังบันทึก" : locale === "th" ? "บันทึกข้อความภาษาไทย" : "บันทึกข้อความภาษาอังกฤษ"}
        </Button>
        {notice && (
          <p role="status" className={clsx("font-body text-[13.5px]", notice.kind === "ok" ? "text-mint" : "text-coral")}>
            {notice.text}
          </p>
        )}
      </div>
    </div>
  );
}

function PhotosTab({ photos, disabled }: { photos: AdminPhoto[]; disabled: boolean }) {
  return (
    <div className="max-w-5xl space-y-4 pb-10">
      {photoSections.map((section) => (
        <PhotoSectionCard
          key={section.id}
          section={section}
          photos={photos.filter((photo) => photo.section === section.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function PhotoSectionCard({
  section,
  photos,
  disabled,
}: {
  section: (typeof photoSections)[number];
  photos: AdminPhoto[];
  disabled: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const busy = pending || progress !== null;

  const run = (action: () => Promise<{ success: true } | { error: string }>, done?: string) => {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) setNotice({ kind: "error", text: result.error });
      else {
        if (done) setNotice({ kind: "ok", text: done });
        router.refresh();
      }
    });
  };

  const upload = async (files: FileList) => {
    setNotice(null);
    let uploaded = 0;
    try {
      for (const [index, file] of Array.from(files).entries()) {
        setProgress(`กำลังอัปโหลด ${index + 1} จาก ${files.length}`);
        const { path: storagePath, width, height } = await uploadImage(section.id, file, section.id === "hero" ? 2400 : 1600);
        const result = await addSitePhoto({ section: section.id, storagePath, width, height });
        if ("error" in result) throw new Error(result.error);
        uploaded += 1;
      }
      setNotice({ kind: "ok", text: `อัปโหลดแล้ว ${uploaded} ภาพ` });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ";
      setNotice({ kind: "error", text: uploaded > 0 ? `อัปโหลดได้ ${uploaded} ภาพ แล้วหยุดที่: ${reason}` : reason });
    } finally {
      setProgress(null);
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    }
  };

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[15px] font-semibold text-text-hi">{section.title}</h2>
          <p className="mt-1 font-body text-[12.5px] text-text-faint">{section.help}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={section.max !== 1}
            hidden
            onChange={(event) => event.target.files?.length && upload(event.target.files)}
          />
          <Button variant="primary" disabled={busy || disabled} onClick={() => fileInput.current?.click()}>
            <ImagePlus size={15} /> {progress ?? "อัปโหลดภาพ"}
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong px-4 py-5">
          <p className="font-body text-[13.5px] leading-relaxed text-text-lo">
            ยังไม่มีภาพที่อัปโหลดในหมวดนี้ หน้าเว็บกำลังใช้ภาพชุดเดิมที่มากับเว็บ
            {section.id === "zones"
              ? " ภาพที่อัปโหลดจะแทนภาพชุดเดิมทีละโซนตามลำดับ"
              : " เมื่ออัปโหลดภาพแรก หน้าเว็บจะแสดงเฉพาะภาพที่อัปโหลดในหมวดนี้"}
          </p>
          <Button
            className="mt-3"
            disabled={busy || disabled}
            onClick={() => run(() => importBuiltInPhotos(section.id), "คัดลอกภาพชุดเดิมเข้ามาแล้ว แก้ไขทีละภาพได้เลย")}
          >
            คัดลอกภาพชุดเดิมมาไว้ในระบบ เพื่อแก้ทีละภาพ
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className={clsx("overflow-hidden rounded-lg border border-border bg-panel-raised", !photo.isVisible && "opacity-55")}
            >
              <div className="relative aspect-[4/3] bg-black">
                <Image
                  src={photo.url}
                  alt={photo.title || `ภาพที่ ${index + 1} ของ${section.title}`}
                  fill
                  unoptimized
                  sizes="280px"
                  className="object-contain"
                />
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 font-body text-[11.5px] font-semibold text-white">
                  {index + 1}
                  {section.max && index >= section.max ? " (ไม่แสดง เกินจำนวน)" : !photo.isVisible ? " (ซ่อนอยู่)" : ""}
                </span>
              </div>

              <div className="space-y-2 p-2.5">
                {section.titleLabel && (
                  <Input
                    aria-label={section.titleLabel}
                    placeholder={section.titleLabel}
                    defaultValue={photo.title}
                    disabled={busy}
                    onBlur={(event) => {
                      const title = event.target.value.trim();
                      if (title !== photo.title) run(() => updateSitePhoto(photo.id, { title }));
                    }}
                  />
                )}
                {section.captionLabel && (
                  <Input
                    aria-label={section.captionLabel}
                    placeholder={section.captionLabel}
                    defaultValue={photo.caption}
                    disabled={busy}
                    onBlur={(event) => {
                      const caption = event.target.value.trim();
                      if (caption !== photo.caption) run(() => updateSitePhoto(photo.id, { caption }));
                    }}
                  />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <IconButton label="เลื่อนขึ้น" disabled={busy || index === 0} onClick={() => run(() => moveSitePhoto(photo.id, "up"))}>
                      <ArrowUp size={15} />
                    </IconButton>
                    <IconButton
                      label="เลื่อนลง"
                      disabled={busy || index === photos.length - 1}
                      onClick={() => run(() => moveSitePhoto(photo.id, "down"))}
                    >
                      <ArrowDown size={15} />
                    </IconButton>
                    <IconButton
                      label={photo.isVisible ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ"}
                      disabled={busy}
                      onClick={() => run(() => updateSitePhoto(photo.id, { is_visible: !photo.isVisible }))}
                    >
                      {photo.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </IconButton>
                  </div>
                  <IconButton
                    label="ลบภาพ"
                    danger
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("ลบภาพนี้ออกจากหน้าเว็บถาวร ใช่หรือไม่")) run(() => deleteSitePhoto(photo.id));
                    }}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {notice && (
        <p role="status" className={clsx("mt-3 font-body text-[13px]", notice.kind === "ok" ? "text-mint" : "text-coral")}>
          {notice.text}
        </p>
      )}
    </Card>
  );
}

function IconButton({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex size-8 items-center justify-center rounded-md border border-border",
        disabled ? "cursor-default opacity-40" : "cursor-pointer hover:bg-white/5",
        danger ? "text-coral" : "text-text-lo"
      )}
    >
      {children}
    </button>
  );
}
