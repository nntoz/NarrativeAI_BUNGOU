"use client";

import { useState } from "react";
import Header from "@/components/page/header";
import Mainfield from "@/components/page/mainfield";
// import MouseCursor from "@/components/page/mousestalker";

export default function Home() {
  return (
    <>
      {/* <MouseCursor/> */}
      <Mainfield />
      <Header />
    </>
  );
}
