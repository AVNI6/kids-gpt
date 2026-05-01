"use client";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const supabase = createClient();

const Profile = () => {
  const [profile, setProfile] = useState("");

  const handleClick = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
    setProfile("");
  };

  const handleUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
    }
    if (data?.user) {
      setProfile(data.user.email || "");
    }
  };
  return (
    <>
      <div className="flex gap-4 items-center">
        {profile && (
          <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center">
            {profile.charAt(0).toUpperCase()}
          </div>
        )}

        {!profile && (
          <button
            onClick={() => handleUser()}
            className="active:scale-95 hover:cursor-pointer bg-gray-600 text--white px-3 py-1 rounded-md"
          >
            Get User
          </button>
        )}
        {profile && <div onClick={() => handleClick()}>Log Out</div>}
      </div>
    </>
  );
};

export default Profile;
