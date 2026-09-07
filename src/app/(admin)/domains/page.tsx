"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { authFetch } from "@/lib/auth/client";
import type { DnsStatusSummary, Domain, DomainDnsView } from "./types";
import DomainItemCard from "./DomainItemCard";
import DomainDnsDetails from "./DomainDnsDetails";
import { CardGridSkeleton } from "@/components/page-skeletons";

export default function DomainsPage() {
  const qc = useQueryClient();
  const [hostname, setHostname] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [dnsView, setDnsView] = useState<{
    domain: Domain;
    dns: DomainDnsView;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: async () => {
      const res = await authFetch("/api/domains?includeDns=true");
      return (await res.json()) as {
        domains: Domain[];
        dns: Record<string, DnsStatusSummary>;
      };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname,
          enableRouting: true,
          enableSending: true,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: () => {
      setHostname("");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["domains"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/domains/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["domains"] }),
  });

  const loadDns = async (id: string) => {
    const res = await authFetch(`/api/domains/${id}/dns`);
    const json = (await res.json()) as { domain: Domain; dns: DomainDnsView };
    if (res.ok) setDnsView(json);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Domains</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Domains must be on your Cloudflare account. Adding a domain enables
            Email Routing and Email Sending DNS automatically.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add domain</DialogTitle>
              <DialogDescription>
                Provision Cloudflare routing and sending DNS for a zone in your
                account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="example.com"
                />
              </div>
              {create.isError && (
                <div className="space-y-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p>{(create.error as Error).message}</p>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Check that your Cloudflare API token has these permissions:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>
                        All accounts — Email Sending:Edit, DNS Settings:Edit,
                        Email Routing Addresses:Edit
                      </li>
                      <li>
                        All zones — DNS Settings:Edit, Email Routing Rules:Edit,
                        Zone Settings:Edit, DNS:Edit
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              <Button
                onClick={() => create.mutate()}
                disabled={!hostname || create.isPending}
              >
                {create.isPending ? "Adding..." : "Add domain"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <section className="space-y-3">
        {/* <div className="flex items-center justify-between">
					<span className="text-sm text-neutral-500">{(data?.domains ?? []).length} total</span>
				</div> */}
        {isLoading && (
          <CardGridSkeleton />
        )}
        {!isLoading && (data?.domains ?? []).length === 0 && (
          <p className="rounded-2xl bg-white px-5 py-4 text-sm text-neutral-500">
            No domains yet
          </p>
        )}
        <div className="grid gap-3">
          {(data?.domains ?? []).map((d) => {
            const dns = data?.dns?.[d.id];
            return (
              <DomainItemCard
                key={d.id}
                dns={dns}
                loadDns={loadDns}
                item={d}
                remove={remove}
              />
            );
          })}
        </div>
      </section>
      {dnsView && (
        <DomainDnsDetails domain={dnsView.domain} dns={dnsView.dns} />
      )}
    </div>
  );
}
