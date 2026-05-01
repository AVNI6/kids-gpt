import { Button } from "@/components/ui/button";
import Link from "next/link";

import React from "react";

const Navbar = () => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="lg">
        <Link href="/signin">Sign In</Link>
      </Button>
      <Button size="lg">
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
};

export default Navbar;
