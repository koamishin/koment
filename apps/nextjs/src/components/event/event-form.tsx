"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@saasfly/ui/form";
import * as Icons from "@saasfly/ui/icons";
import { Input } from "@saasfly/ui/input";
import { Switch } from "@saasfly/ui/switch";
import { Textarea } from "@saasfly/ui/textarea";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

interface EventFormProps {
  organizationId: number;
  dict: EventDict;
  params: { lang: string };
  event?: {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
    coverImage: string | null;
    startsAt: Date;
    endsAt: Date | null;
    capacity: number | null;
    requireApproval: boolean;
    isPublic: boolean;
    status: "DRAFT" | "PUBLISHED" | "CANCELED" | "COMPLETED";
  };
  canApproveRegistrations: boolean;
}

const toLocalInputValue = (value: Date): string => {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
};

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, "name must be at least 2 characters.")
      .max(120, "name must be at most 120 characters."),
    description: z.string().max(4000).optional(),
    location: z.string().max(160).optional(),
    coverImage: z
      .string()
      .optional()
      .refine(
        (value) => !value || z.string().url().safeParse(value).success,
        "must be a valid URL",
      ),
    startsAt: z.string().min(1, "Pick a start time."),
    endsAt: z.string().optional(),
    capacity: z
      .string()
      .optional()
      .refine(
        (value) => !value || Number(value) > 0,
        "capacity must be a positive number",
      ),
    requireApproval: z.boolean(),
    isPublic: z.boolean(),
  })
  .refine(
    (values) =>
      !values.endsAt || !values.startsAt || values.endsAt >= values.startsAt,
    { message: "end time must be after the start time", path: ["endsAt"] },
  );

export function EventForm({
  organizationId,
  dict,
  params,
  event,
  canApproveRegistrations,
}: EventFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const isEditing = Boolean(event);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: event?.name ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      coverImage: event?.coverImage ?? "",
      startsAt: event ? toLocalInputValue(new Date(event.startsAt)) : "",
      endsAt: event?.endsAt ? toLocalInputValue(new Date(event.endsAt)) : "",
      capacity: event?.capacity ? String(event.capacity) : "",
      requireApproval: event?.requireApproval ?? false,
      isPublic: event?.isPublic ?? true,
    },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);

    const payload = {
      organizationId,
      name: values.name,
      description: values.description,
      location: values.location,
      coverImage: values.coverImage,
      startsAt: new Date(values.startsAt),
      endsAt: values.endsAt ? new Date(values.endsAt) : undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
      requireApproval: values.requireApproval,
      isPublic: values.isPublic,
    };

    let eventId = event?.id ?? "";

    try {
      if (event) {
        const response = await trpc.event.update.mutate({
          ...payload,
          id: event.id,
        });

        if (!response?.success) {
          return toast({
            title: "Something went wrong.",
            description: "Your event was not saved. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        const response = await trpc.event.create.mutate({
          ...payload,
          status: "DRAFT",
        });

        if (!response?.success) {
          return toast({
            title: "Something went wrong.",
            description: "Your event was not created. Please try again.",
            variant: "destructive",
          });
        }

        eventId = String(response.id);
      }

      toast({ description: isEditing ? dict.event_saved : dict.event_created });
      router.push(
        `/${params.lang}/dashboard/organizations/${organizationId}/events/${eventId}`,
      );
      router.refresh();
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isEditing ? dict.save_event : dict.create_event}
            </CardTitle>
            <CardDescription>{dict.title_text}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.event_name}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={dict.event_name_placeholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.description}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={dict.description_placeholder}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.location}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={dict.location_placeholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.cover_image}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.starts_at}</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="startsAt"
                        render={() => (
                          <Input type="datetime-local" {...field} />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.ends_at}</FormLabel>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="endsAt"
                        render={() => (
                          <Input type="datetime-local" {...field} />
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.capacity}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>{dict.capacity_hint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{dict.status}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{dict.is_public}</FormLabel>
                    <FormDescription>{dict.is_public_hint}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requireApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{dict.require_approval}</FormLabel>
                    <FormDescription>
                      {canApproveRegistrations
                        ? dict.require_approval_hint
                        : dict.upgrade_hint}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      disabled={!canApproveRegistrations}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving && (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? dict.save_event : dict.create_event}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(
                `/${params.lang}/dashboard/organizations/${organizationId}`,
              )
            }
          >
            {dict.canceled}
          </Button>
        </div>
      </form>
    </Form>
  );
}
