"use client";

import React from "react";
import Link from "next/link";

import * as Icons from "@saasfly/ui/icons";
import { DocumentGuide } from "~/components/document-guide";
import { MobileNav } from "~/components/mobile-nav";

import type { MainNavItem } from "~/types";

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
  params: {
    lang: string;
  };
  marketing?: Record<string, string | object>;
}

export function MainNav({ items, children, params: { lang }, marketing }: MainNavProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);
  const toggleMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };
  const handleMenuItemClick = () => {
    toggleMenu();
  };
  return (
    <div className="flex gap-6 md:gap-10">
      <div className="flex items-center">
        <Link href={`/${lang}`} className="hidden items-center space-x-2.5 md:flex">
          <Icons.Trophy className="h-6 w-6 text-amber-500" />
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-500 to-amber-500 bg-clip-text text-transparent">
            Koment
          </span>
        </Link>

        <Link href={`/${lang}/tournaments`} className="ml-4 hidden md:flex lg:flex xl:flex">
          <DocumentGuide>
            {typeof marketing?.introducing === "string" ? marketing?.introducing : "Introducing Koment"}
          </DocumentGuide>
        </Link>
      </div>

      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.Close/> : <Icons.Logo/>}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} menuItemClick={handleMenuItemClick}>
          {children}
        </MobileNav>
      )}
    </div>
  );
}
