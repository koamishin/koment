"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@saasfly/ui/badge";
import { Button } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@saasfly/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
import { Switch } from "@saasfly/ui/switch";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "EMAIL",
  "PHONE",
  "NUMBER",
  "DATE",
  "SELECT",
  "CHECKBOX",
] as const;

type FieldTypeValue = (typeof FIELD_TYPES)[number];

interface FieldRow {
  id: number;
  key: string;
  label: string;
  type: FieldTypeValue;
  options: string | null;
  required: boolean;
  position: number;
}

interface FieldEditorProps {
  eventId: number;
  fields: FieldRow[];
  canCustomFields: boolean;
  maxCustomFields: number;
  dict: EventDict;
}

const fieldSchema = z.object({
  key: z
    .string()
    .min(1, "key is required")
    .max(48)
    .regex(
      /^[a-z0-9_]+$/,
      "key must be lowercase letters, numbers and underscores",
    ),
  label: z.string().min(1, "label is required").max(80),
  type: z.enum(FIELD_TYPES),
  options: z.string().optional(),
  required: z.boolean(),
});

export function FieldEditor({
  eventId,
  fields,
  canCustomFields,
  maxCustomFields,
  dict,
}: FieldEditorProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof fieldSchema>>({
    defaultValues: {
      key: "",
      label: "",
      type: "TEXT",
      options: "",
      required: false,
    },
    resolver: zodResolver(fieldSchema),
  });

  const atLimit = maxCustomFields >= 0 && fields.length >= maxCustomFields;
  const canAdd = canCustomFields && !atLimit;

  function refresh() {
    router.refresh();
  }

  async function onSubmit(values: z.infer<typeof fieldSchema>) {
    setIsSaving(true);

    try {
      const response = await trpc.event.upsertField.mutate({
        eventId,
        key: values.key,
        label: values.label,
        type: values.type,
        required: values.required,
        options:
          values.type === "SELECT"
            ? values.options
                ?.split(",")
                .map((option) => option.trim())
                .filter(Boolean)
            : undefined,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "The field was not saved. Please try again.",
          variant: "destructive",
        });
      }

      form.reset();
      setOpen(false);
      refresh();
      toast({ description: dict.custom_fields });
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

  async function onDelete(fieldId: number) {
    try {
      const response = await trpc.event.deleteField.mutate({
        eventId,
        fieldId,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "The field was not deleted. Please try again.",
          variant: "destructive",
        });
      }

      refresh();
      toast({ description: dict.custom_fields });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onShift(index: number, delta: number) {
    const next = [...fields];
    const target = index + delta;
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) {
      return;
    }
    next[index] = swap;
    next[target] = current;

    try {
      await trpc.event.reorderFields.mutate({
        eventId,
        fieldIds: next.map((field) => field.id),
      });
      refresh();
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{dict.custom_fields}</CardTitle>
          <CardDescription>{dict.custom_fields_text}</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                if (!canAdd) {
                  return toast({
                    title: "Plan limit reached.",
                    description: canCustomFields
                      ? `${dict.custom_fields}: ${fields.length}/${maxCustomFields}`
                      : dict.upgrade_hint,
                    variant: "destructive",
                  });
                }
                return setOpen(true);
              }}
            >
              <Icons.Add className="mr-2 h-4 w-4" />
              {dict.add_field}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.add_field}</DialogTitle>
              <DialogDescription>{dict.custom_fields_text}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.field_label}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.field_key}</FormLabel>
                      <FormControl>
                        <Input placeholder="tshirt_size" {...field} />
                      </FormControl>
                      <FormDescription>{dict.field_key_hint}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.field_type}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("type") === "SELECT" ? (
                  <FormField
                    control={form.control}
                    name="options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.field_options}</FormLabel>
                        <FormControl>
                          <Input placeholder="S,M,L" {...field} />
                        </FormControl>
                        <FormDescription>
                          {dict.field_options_hint}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel>{dict.field_required}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving && (
                    <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {dict.add_field}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {fields.length ? (
          <ul className="space-y-2">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{field.label}</span>
                    {field.required ? (
                      <Badge variant="warning">{dict.field_required}</Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {field.type}
                    {field.options ? ` · ${field.options}` : ""} · {field.key}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => void onShift(index, -1)}
                  >
                    <Icons.ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === fields.length - 1}
                    onClick={() => void onShift(index, 1)}
                  >
                    <Icons.ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void onDelete(field.id)}
                  >
                    <Icons.Trash className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Icons.Post className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">{dict.no_fields_title}</p>
            <p className="text-xs text-muted-foreground">
              {dict.no_fields_text}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
