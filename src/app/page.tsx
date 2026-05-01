import Profile from "./profile/page";

export default async function Home() {
  return (
    <div className="flex justify-between">
      <div>Kids-GPT</div>
      <Profile />
    </div>
  );
}
