"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@saasfly/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@saasfly/ui/form";
import { Input } from "@saasfly/ui/input";
import * as Icons from "@saasfly/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saasfly/ui/tabs";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

interface OrganizationDialogProps {
  dict: EventDict;
  params: { lang: string };
}

const createSchema = z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters.")
    .max(64, "name must be at most 64 characters."),
});

const joinSchema = z.object({
  joinCode: z.string().min(4, "Enter the invite code."),
});

export function OrganizationDialog({ dict, params }: OrganizationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState<boolean>(false);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [isJoining, setIsJoining] = React.useState<boolean>(false);

  const createForm = useForm<z.infer<typeof createSchema>>({
    defaultValues: { name: "" },
    resolver: zodResolver(createSchema),
  });
  const joinForm = useForm<z.infer<typeof joinSchema>>({
    defaultValues: { joinCode: "" },
    resolver: zodResolver(joinSchema),
  });

  async function onCreate(values: z.infer<typeof createSchema>) {
    setIsCreating(true);

    try {
      const response = await trpc.organization.create.mutate({
        name: values.name,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "Your organization was not created. Please try again.",
          variant: "destructive",
        });
      }

      createForm.reset();
      setOpen(false);
      router.push(`/${params.lang}/dashboard/organizations/${response.id}`);
      router.refresh();
      toast({ description: "Your organization has been created." });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function onJoin(values: z.infer<typeof joinSchema>) {
    setIsJoining(true);

    try {
      const response = await trpc.organization.join.mutate({
        joinCode: values.joinCode,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description:
            "We could not join that organization. Check the invite code.",
          variant: "destructive",
        });
      }

      joinForm.reset();
      setOpen(false);
      router.push(`/${params.lang}/dashboard/organizations/${response.id}`);
      router.refresh();
      toast({ description: "You have joined the organization." });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.Add className="mr-2 h-4 w-4" />
          {dict.create_org}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dict.orgs}</DialogTitle>
          <DialogDescription>{dict.orgs_text}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{dict.create_org}</TabsTrigger>
            <TabsTrigger value="join">{dict.join_org}</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreate)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.org_name}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={dict.org_name_placeholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating && (
                    <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {dict.create_org}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="join" className="mt-4">
            <Form {...joinForm}>
              <form
                onSubmit={joinForm.handleSubmit(onJoin)}
                className="space-y-4"
              >
                <FormField
                  control={joinForm.control}
                  name="joinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.join_code}</FormLabel>
                      <FormControl>
                        <Input
                          className="uppercase"
                          placeholder={dict.join_code_placeholder}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isJoining} className="w-full">
                  {isJoining && (
                    <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {dict.join_org}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
