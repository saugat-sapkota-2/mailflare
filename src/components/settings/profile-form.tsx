"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/auth/client";
import { dispatchProfileNameChanged } from "@/lib/profile/name-client";
import { ProfileAvatarForm } from "./profile-avatar-form";
import type { ProfileFormProps, ProfileFormResponse } from "./types";

export function ProfileForm({
  initialName,
  initialResetEmail,
  email,
}: ProfileFormProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [resetEmail, setResetEmail] = useState(initialResetEmail);
  const [savedName, setSavedName] = useState(initialName);
  const [savedResetEmail, setSavedResetEmail] = useState(initialResetEmail);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);

  async function saveProfile(nextName: string, nextResetEmail: string) {
    try {
      const res = await authFetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName, resetEmail: nextResetEmail }),
      });
      const data = (await res.json()) as ProfileFormResponse;

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : t("settings.profile.updateFailed"),
        );
      }

      const savedName = data.user?.name ?? nextName.trim();
      const savedResetEmail = data.user?.resetEmail ?? "";
      setName(savedName);
      setResetEmail(savedResetEmail);
      setSavedName(savedName);
      setSavedResetEmail(savedResetEmail);
      dispatchProfileNameChanged(savedName);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error(t("settings.profile.updateFailed"));
    }
  }

  async function onProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      await saveProfile(name, savedResetEmail);
      setProfileStatus(t("common.saved"));
    } catch (error) {
      setProfileStatus(
        error instanceof Error ? error.message : t("settings.profile.updateFailed"),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function onRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRecovery(true);
    setRecoveryStatus(null);
    try {
      await saveProfile(savedName, resetEmail);
      setRecoveryStatus(t("common.saved"));
    } catch (error) {
      setRecoveryStatus(
        error instanceof Error
          ? error.message
          : t("settings.profile.recoveryFailed"),
      );
    } finally {
      setSavingRecovery(false);
    }
  }

  return (
    <>
      <form
        onSubmit={onProfileSubmit}
        className="space-y-6 rounded-b-lg rounded-t-3xl bg-white p-6"
      >
        <div className="flex items-center gap-4">
          <ProfileAvatarForm name={name} colorSeed={email} />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {t("settings.profile.pictureTitle")}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {t("settings.profile.pictureDescription")}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">{t("common.name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountEmail">{t("settings.profile.currentEmail")}</Label>
          <Input
            id="accountEmail"
            value={email}
            type="email"
            readOnly
            aria-readonly="true"
            className="bg-neutral-50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={savingProfile || name.trim() === savedName}
          >
            {savingProfile ? t("common.saving") : t("settings.profile.save")}
          </Button>
          {profileStatus && (
            <p className="text-sm text-neutral-500">{profileStatus}</p>
          )}
        </div>
      </form>

      <form
        onSubmit={onRecoverySubmit}
        className="space-y-4 rounded-lg bg-white p-6"
      >
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {t("settings.profile.recoveryTitle")}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {t("settings.profile.recoveryDescription")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resetEmail">{t("settings.profile.emailAddress")}</Label>
          <Input
            id="resetEmail"
            value={resetEmail}
            onChange={(event) => setResetEmail(event.target.value)}
            type="email"
            placeholder="recovery@example.com"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={savingRecovery || resetEmail.trim() === savedResetEmail}
          >
            {savingRecovery ? t("common.saving") : t("settings.profile.saveRecovery")}
          </Button>
          {recoveryStatus && (
            <p className="text-sm text-neutral-500">{recoveryStatus}</p>
          )}
        </div>
      </form>
    </>
  );
}
