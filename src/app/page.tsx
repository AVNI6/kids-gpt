import Profile from "./profile/page";

export default async function Home() {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>Kids-GPT</div>
      <Profile />
    </div>
  );
}
