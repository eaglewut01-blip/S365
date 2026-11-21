"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, QrCode, Trash2, Upload, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { deleteItem, moveItem, saveItem, setItemVisible } from "@/lib/actions/collections";
import {
  itemClip,
  itemImage,
  type CollectionDef,
  type CollectionField,
  type CollectionId,
  type ItemData,
} from "@/content/collections";
import { uploadClip, uploadImage } from "./media";

export interface AdminItem {
  id: string;
  collection: CollectionId;
  slug: string | null;
  data: ItemData;
  isVisible: boolean;
}

type Notice = { kind: "ok" | "error"; text: string } | null;

const fieldClasses =
  "w-full rounded-lg border border-border bg-panel-raised px-3 py-2 font-body text-[13.5px] text-text-hi outline-none placeholder:text-text-faint";

// Where an item's own public page lives, for the lists that have one.
const PUBLIC_PATH: Partial<Record<CollectionId, string>> = { machines: "/machines", articles: "/articles" };

export function CollectionEditor({
  def,
  items,
  mediaBase,
  disabled,
}: {
  def: CollectionDef;
  items: AdminItem[];
  /** Public URL prefix of the storage bucket, for thumbnails. */
  mediaBase: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminItem | "new" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

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

  const thumbnail = (data: ItemData) => {
    const image = itemImage(data, "photo") ?? itemImage(data, "cover") ?? itemClip(data, "clip")?.poster ?? null;
    return image ? `${mediaBase}/${image.path}` : null;
  };

  return (
    <div className="max-w-4xl space-y-4 pb-10">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-xl font-body text-[13px] leading-relaxed text-text-lo">{def.help}</p>
          <div className="flex gap-2">
            {def.id === "machines" && items.length > 0 && (
              <a
                href="/owner/website/qr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2 font-body text-[13.5px] font-semibold text-text-hi hover:bg-white/5"
              >
                <QrCode size={15} /> พิมพ์ป้าย QR
              </a>
            )}
            <Button variant="primary" disabled={disabled || editing !== null} onClick={() => setEditing("new")}>
              <Plus size={15} /> เพิ่ม{def.itemLabel}
            </Button>
          </div>
        </div>
        {notice && (
          <p role="status" className={clsx("mt-3 font-body text-[13px]", notice.kind === "ok" ? "text-mint" : "text-coral")}>
            {notice.text}
          </p>
        )}
      </Card>

      {editing !== null && (
        <ItemForm
          key={editing === "new" ? "new" : editing.id}
          def={def}
          item={editing === "new" ? null : editing}
          mediaBase={mediaBase}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice({ kind: "ok", text: "บันทึกแล้ว หน้าเว็บอัปเดตเรียบร้อย" });
            router.refresh();
          }}
        />
      )}

      {items.length === 0 && editing === null ? (
        <Card>
          <p className="font-body text-[13.5px] text-text-lo">ยังไม่มี{def.itemLabel} หน้าเว็บจะยังไม่แสดงส่วนนี้จนกว่าจะเพิ่มรายการแรก</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const src = thumbnail(item.data);
            const publicPath = PUBLIC_PATH[def.id] && item.slug ? `${PUBLIC_PATH[def.id]}/${item.slug}` : null;
            return (
              <li key={item.id}>
                <Card className={clsx("flex items-center gap-3 p-3", !item.isVisible && "opacity-55")}>
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-black">
                    {src && <Image src={src} alt="" fill unoptimized sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[14.5px] font-semibold text-text-hi">
                      {String(item.data[def.titleKey] ?? "(ไม่มีชื่อ)")}
                      {!item.isVisible && <span className="ml-2 text-[12px] font-medium text-text-faint">ซ่อนอยู่</span>}
                    </p>
                    {publicPath && (
                      <a href={publicPath} target="_blank" rel="noopener noreferrer" className="font-body text-[12px] text-text-faint hover:text-volt">
                        {publicPath}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconButton label="แก้ไข" disabled={pending || editing !== null} onClick={() => setEditing(item)}>
                      <Pencil size={15} />
                    </IconButton>
                    {def.id !== "articles" && (
                      <>
                        <IconButton label="เลื่อนขึ้น" disabled={pending || index === 0} onClick={() => run(() => moveItem(item.id, "up"))}>
                          <ArrowUp size={15} />
                        </IconButton>
                        <IconButton label="เลื่อนลง" disabled={pending || index === items.length - 1} onClick={() => run(() => moveItem(item.id, "down"))}>
                          <ArrowDown size={15} />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      label={item.isVisible ? "ซ่อนจากหน้าเว็บ" : "แสดงบนหน้าเว็บ"}
                      disabled={pending}
                      onClick={() => run(() => setItemVisible(item.id, !item.isVisible))}
                    >
                      {item.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </IconButton>
                    <IconButton
                      label="ลบ"
                      danger
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`ลบ${def.itemLabel}นี้ถาวร ใช่หรือไม่`)) run(() => deleteItem(item.id), "ลบแล้ว");
                      }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ItemForm({
  def,
  item,
  mediaBase,
  onClose,
  onSaved,
}: {
  def: CollectionDef;
  item: AdminItem | null;
  mediaBase: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<ItemData>(() => ({ ...(item?.data ?? (def.id === "videos" ? { home: true } : {})) }));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: unknown) => {
    setData((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const save = () =>
    startTransition(async () => {
      const result = await saveItem({ id: item?.id, collection: def.id, data });
      if ("error" in result) setError(result.error);
      else onSaved();
    });

  return (
    <Card className="border-volt/40">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-body text-[15px] font-semibold text-text-hi">
          {item ? `แก้ไข${def.itemLabel}` : `เพิ่ม${def.itemLabel}`}
        </h2>
        <button type="button" onClick={onClose} aria-label="ปิด" className="cursor-pointer text-text-lo hover:text-text-hi">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {def.fields.map((field) => (
          <div key={field.key}>
            {field.type !== "toggle" && (
              <label htmlFor={`f-${field.key}`} className="mb-1.5 block font-body text-[13px] font-medium text-text-lo">
                {field.label}
                {field.required && <span className="ml-1 text-volt">*</span>}
              </label>
            )}
            <FieldInput
              def={def}
              field={field}
              value={data[field.key]}
              mediaBase={mediaBase}
              busy={uploading === field.key}
              onChange={(value) => set(field.key, value)}
              onUpload={async (work) => {
                setUploading(field.key);
                setError(null);
                try {
                  set(field.key, await work());
                } catch (reason) {
                  setError(reason instanceof Error ? reason.message : "อัปโหลดไม่สำเร็จ");
                } finally {
                  setUploading(null);
                }
              }}
            />
            {field.help && <p className="mt-1.5 font-body text-[12px] text-text-faint">{field.help}</p>}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-border pt-4">
        <Button variant="primary" onClick={save} disabled={pending || uploading !== null} className="px-6 py-2.5">
          {pending ? "กำลังบันทึก" : "บันทึก"}
        </Button>
        <Button onClick={onClose} disabled={pending}>
          ยกเลิก
        </Button>
        {error && (
          <p role="alert" className="font-body text-[13.5px] text-coral">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

function FieldInput({
  def,
  field,
  value,
  mediaBase,
  busy,
  onChange,
  onUpload,
}: {
  def: CollectionDef;
  field: CollectionField;
  value: unknown;
  mediaBase: string;
  busy: boolean;
  onChange: (value: unknown) => void;
  onUpload: (work: () => Promise<unknown>) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const id = `f-${field.key}`;

  if (field.type === "toggle") {
    return (
      <label className="flex cursor-pointer items-center gap-2.5 font-body text-[13.5px] text-text-hi">
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#f2a91e]" />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        id={id}
        rows={field.rows ?? 3}
        value={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(fieldClasses, "resize-y leading-relaxed")}
      />
    );
  }

  if (field.type === "image" || field.type === "clip") {
    const image = field.type === "image" ? itemImage({ v: value }, "v") : null;
    const clip = field.type === "clip" ? itemClip({ v: value }, "v") : null;
    const preview = image ?? clip?.poster ?? null;
    return (
      <div className="flex flex-wrap items-center gap-3">
        {(image || clip) && (
          <div className="relative h-20 w-28 overflow-hidden rounded-md bg-black">
            {preview ? (
              <Image src={`${mediaBase}/${preview.path}`} alt="" fill unoptimized sizes="112px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-body text-[11px] text-text-faint">มีคลิปแล้ว</span>
            )}
          </div>
        )}
        <input
          ref={fileInput}
          id={id}
          type="file"
          hidden
          accept={field.type === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm,video/quicktime"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(() => (field.type === "image" ? uploadImage(def.id, file) : uploadClip(def.id, file)));
            event.target.value = "";
          }}
        />
        <Button disabled={busy} onClick={() => fileInput.current?.click()}>
          <Upload size={15} /> {busy ? "กำลังอัปโหลด" : image || clip ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}
        </Button>
        {(image || clip) && (
          <Button variant="ghost" disabled={busy} onClick={() => onChange(null)}>
            เอาออก
          </Button>
        )}
      </div>
    );
  }

  return (
    <Input
      id={id}
      inputMode={field.type === "number" ? "decimal" : field.type === "url" ? "url" : undefined}
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
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
