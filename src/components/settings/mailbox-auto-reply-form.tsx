"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MailboxAutoReplySettings } from "./types";
import { updateMailboxAutoReply } from "./utils";
import { Switch } from "../ui/switch";

const defaultSettings: MailboxAutoReplySettings = {
  enabled: false,
  subject: "Out of office",
  body: "",
};

export function MailboxAutoReplyForm() {
  const { t } = useLanguage();
  const { selectedMailbox, setSelectedMailbox, isLoading } =
    useSelectedMailbox();
  const [settings, setSettings] = useState(defaultSettings);
  const [savedSettings, setSavedSettings] = useState(defaultSettings);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextSettings = {
      enabled: selectedMailbox?.autoReplyEnabled ?? false,
      subject: selectedMailbox?.autoReplySubject ?? "Out of office",
      body: selectedMailbox?.autoReplyBody ?? "",
    };
    setSettings(nextSettings);
    setSavedSettings(nextSettings);
    setStatus(null);
  }, [
    selectedMailbox?.id,
    selectedMailbox?.autoReplyEnabled,
    selectedMailbox?.autoReplySubject,
    selectedMailbox?.autoReplyBody,
  ]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMailbox) return;
    if (settings.enabled && !settings.body.trim()) {
      setStatus(t("settings.autoReply.needMessage"));
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const saved = await updateMailboxAutoReply(selectedMailbox.id, settings);
      setSettings(saved);
      setSavedSettings(saved);
      setSelectedMailbox({
        ...selectedMailbox,
        autoReplyEnabled: saved.enabled,
        autoReplySubject: saved.subject,
        autoReplyBody: saved.body,
      });
      setStatus(t("common.saved"));
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : t("settings.autoReply.failed"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading)
    return <p className="text-sm text-neutral-500">{t("settings.signature.loadingInbox")}</p>;
  if (!selectedMailbox)
    return (
      <p className="text-sm text-neutral-500">
        {t("settings.autoReply.selectInbox")}
      </p>
    );

  const address = `${selectedMailbox.localPart}@${selectedMailbox.hostname}`;
  const canManage = selectedMailbox.permission === "full_access";
  const changed = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
        <span className="flex-1">
          <span className="block text-sm font-medium text-neutral-900">
            {t("settings.autoReply.enableFor", { address })}
          </span>
          <span className="mt-1 block text-sm text-neutral-500">
            {t("settings.autoReply.limit")}
          </span>
        </span>

        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
          disabled={!canManage || saving}
        />
      </label>
      {settings.enabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="autoReplySubject">{t("settings.autoReply.subject")}</Label>
            <Input
              id="autoReplySubject"
              value={settings.subject}
              onChange={(event) =>
                setSettings({ ...settings, subject: event.target.value })
              }
              placeholder={t("settings.autoReply.subjectPlaceholder")}
              disabled={!canManage || saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="autoReplyBody">{t("settings.autoReply.message")}</Label>
            <Textarea
              id="autoReplyBody"
              value={settings.body}
              onChange={(event) =>
                setSettings({ ...settings, body: event.target.value })
              }
              placeholder={t("settings.autoReply.messagePlaceholder")}
              rows={7}
              disabled={!canManage || saving}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canManage || saving || !changed}>
              {saving ? t("common.saving") : t("settings.autoReply.save")}
            </Button>
            {!canManage && (
              <p className="text-sm text-neutral-500">
                {t("settings.autoReply.needFullAccess")}
              </p>
            )}
            {status && <p className="text-sm text-neutral-500">{status}</p>}
          </div>
        </>
      )}
    </form>
  );
}
