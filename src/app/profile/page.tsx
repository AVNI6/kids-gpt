"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const Profile = () => {
  const handleUser = async () => {
    const { data } = await supabase.auth.getUser();
    console.log(data);
  };
  return (
    <button
      onClick={() => handleUser()}
      className="active:scale-95 hover:cursor-pointer bg-gray-600 text--white px-3 py-1 rounded-md"
    >
      Get User
    </button>
  );
};

export default Profile;
