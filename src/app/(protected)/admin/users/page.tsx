import { getUsers } from '@/app/actions/user';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCog, Trash2, ShieldCheck, Shield } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CreateUserModal } from "@/components/create-user-modal"; // Kita buat setelah ini
import { DeleteUserButton } from "@/components/delete-user-button"; 

export default async function UserManagementPage() {
  const users = await getUsers();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sticky top-0 z-10 font-sans">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-tighter">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>Management User</span>
          </div>
        </div>
        <CreateUserModal />
      </header>

      <main className="p-6 font-sans bg-slate-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-slate-700">USERNAME</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">ROLE</TableHead>
                <TableHead className="font-bold text-slate-700 text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold text-slate-900">{user.username}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={user.role === 'ADMIN' ? 'bg-amber-500' : 'bg-slate-400'}>
                      {user.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteUserButton id={user.id} username={user.username} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}