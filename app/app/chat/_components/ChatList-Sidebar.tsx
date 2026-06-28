import ChatListSidebarClient from "./ChatListSidebarClient";
import { getChatPreviews } from "./chat-preview-data";

export default async function ChatListSidebar() {
  const { conversations, userId } = await getChatPreviews();

  return <ChatListSidebarClient initialConversations={conversations} userId={userId} />;
}
