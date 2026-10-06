"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import { Checkbox } from "@saasfly/ui/checkbox";
import * as Icons from "@saasfly/ui/icons";
import { Input } from "@saasfly/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
import { Textarea } from "@saasfly/ui/textarea";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

type FieldTypeValue =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "SELECT"
  | "CHECKBOX";

interface RegistrationFieldSpec {
  key: string;
  label: string;
  type: FieldTypeValue;
  options: string | null;
  required: boolean;
}

interface RegistrationFormProps {
  slug: string;
  fields: RegistrationFieldSpec[];
  defaults: { name: string; email: string };
  dict: EventDict;
}

type Answers = Record<string, string | boolean>;

export function RegistrationForm({
  slug,
  fields,
  defaults,
  dict,
}: RegistrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldError(null);

    const form = new FormData(event.currentTarget);

    try {
      const result = await trpc.registration.register.mutate({
        slug,
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        answers,
      });

      router.refresh();
      toast({
        description:
          result.status === "PENDING"
            ? dict.registered_pending
            : dict.registered_ok,
      });
    } catch (error) {
      setFieldError(
        error instanceof Error ? error.message : dict.no_registrations_text,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function setAnswer(key: string, value: string | boolean) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{dict.register}</CardTitle>
        <CardDescription>{dict.attend}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                {dict.attendee}
              </label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaults.name}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaults.email}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone
            </label>
            <Input id="phone" name="phone" type="tel" />
          </div>

          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label htmlFor={field.key} className="text-sm font-medium">
                {field.label}
                {field.required ? (
                  <span className="ml-0.5 text-destructive">*</span>
                ) : null}
              </label>

              {field.type === "TEXTAREA" ? (
                <Textarea
                  id={field.key}
                  required={field.required}
                  value={String(answers[field.key] ?? "")}
                  onChange={(changeEvent) =>
                    setAnswer(field.key, changeEvent.target.value)
                  }
                />
              ) : field.type === "SELECT" ? (
                <Select
                  value={String(answers[field.key] ?? "")}
                  onValueChange={(value) => setAnswer(field.key, value)}
                >
                  <SelectTrigger id={field.key}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? "")
                      .split(",")
                      .map((option) => option.trim())
                      .filter(Boolean)
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : field.type === "CHECKBOX" ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.key}
                    checked={Boolean(answers[field.key])}
                    onCheckedChange={(checked) =>
                      setAnswer(field.key, checked === true)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {field.label}
                  </span>
                </div>
              ) : (
                <Input
                  id={field.key}
                  required={field.required}
                  type={
                    field.type === "NUMBER"
                      ? "number"
                      : field.type === "EMAIL"
                        ? "email"
                        : field.type === "PHONE"
                          ? "tel"
                          : field.type === "DATE"
                            ? "date"
                            : "text"
                  }
                  value={String(answers[field.key] ?? "")}
                  onChange={(changeEvent) =>
                    setAnswer(field.key, changeEvent.target.value)
                  }
                />
              )}
            </div>
          ))}

          {fieldError ? (
            <p className="px-1 text-xs text-red-600">{fieldError}</p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && (
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? dict.registering : dict.register}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface CancelRegistrationButtonProps {
  registrationId: number;
  dict: EventDict;
}

export function CancelRegistrationButton({
  registrationId,
  dict,
}: CancelRegistrationButtonProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = React.useState<boolean>(false);

  async function onCancel() {
    setIsCancelling(true);

    try {
      const response = await trpc.registration.cancelMine.mutate({
        registrationId,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "Your registration was not cancelled. Please try again.",
          variant: "destructive",
        });
      }

      router.refresh();
      toast({ description: dict.canceled });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isCancelling}
      onClick={onCancel}
    >
      {isCancelling ? (
        <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.Close className="mr-2 h-4 w-4" />
      )}
      {dict.cancel_registration}
    </Button>
  );
}
