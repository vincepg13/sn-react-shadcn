import { SnActivity } from "@kit/types/form-schema";
import { Card, CardContent } from "@kit/components/ui/card"
import { Avatar, AvatarFallback } from "@kit/components/ui/avatar"
import { Badge } from "@kit/components/ui/badge"
// import { Separator } from "@kit/components/ui/separator"

export function SnFormActivity({activity}: { activity: SnActivity }) {
  console.log("SnFormActivity", activity) 
  const dummyEntries = [
  {
    sys_id: "1",
    sys_created_on_adjusted: "27/05/2025 16:25:28",
    sys_created_on: "2025-05-27 15:25:28",
    login_name: "System",
    user_sys_id: "system",
    initials: "S",
    name: "System",
    field_label: "Comments",
    contains_code: false,
    is_truncated: false,
    value: "Timesheet CLB002631-002 was approved by Laura MIRABELLA",
    element: "comments",
  },
  {
    sys_id: "2",
    sys_created_on_adjusted: "27/05/2025 16:25:16",
    sys_created_on: "2025-05-27 15:25:16",
    login_name: "System",
    user_sys_id: "system",
    initials: "S",
    name: "System",
    field_label: "Comments",
    contains_code: false,
    is_truncated: false,
    value: "Timesheet CLB002631-002 was approved by Gianluca Marini",
    element: "comments",
  },
  {
    sys_id: "3",
    sys_created_on_adjusted: "27/05/2025 16:17:38",
    sys_created_on: "2025-05-27 15:17:38",
    login_name: "System",
    user_sys_id: "system",
    initials: "S",
    name: "System",
    field_label: "Comments",
    contains_code: false,
    is_truncated: false,
    value: "Timesheet CLB002631-001 was approved by Laura MIRABELLA",
    element: "comments",
  },
  {
    sys_id: "4",
    sys_created_on_adjusted: "27/05/2025 16:15:12",
    sys_created_on: "2025-05-27 15:15:12",
    login_name: "PEREGO Marta",
    user_sys_id: "user123",
    initials: "PM",
    name: "PEREGO Marta",
    field_label: "Comments",
    contains_code: false,
    is_truncated: false,
    value: "This record was approved by PEREGO Marta",
    element: "comments",
  },
  {
    sys_id: "5",
    sys_created_on_adjusted: "27/05/2025 16:15:10",
    sys_created_on: "2025-05-27 15:15:10",
    login_name: "PEREGO Marta",
    user_sys_id: "user123",
    initials: "PM",
    name: "PEREGO Marta",
    field_label: "Work notes",
    contains_code: false,
    is_truncated: false,
    value: "(PI) MOSCARDI ALESSANDRO Commenti partite di Rugby 06-13lug da firmare con urgenza.pdf",
    element: "work_notes",
  },
  {
    sys_id: "6",
    sys_created_on_adjusted: "27/05/2025 15:14:36",
    sys_created_on: "2025-05-27 14:14:36",
    login_name: "Lucia CERESA",
    user_sys_id: "user456",
    initials: "LC",
    name: "Lucia CERESA",
    field_label: "Work notes",
    contains_code: false,
    is_truncated: false,
    value: "(PO) Manager Hub - Managing Tasks.pdf",
    element: "work_notes",
  }
];

  return (
    <div className="relative pl-8 border-l border-muted space-y-6">
      {dummyEntries.map((entry) => (
        <div key={entry.sys_id} className="relative flex gap-4 items-start">
          {/* Timeline dot */}
          <div className="absolute -left-4 top-2">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback>{entry.initials}</AvatarFallback>
            </Avatar>
          </div>

          {/* Entry content */}
          <Card className="w-full">
            <CardContent className="p-4 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{entry.name}</span>
                <span>{entry.sys_created_on_adjusted}</span>
              </div>
              <Badge variant="outline">{entry.field_label}</Badge>
              <p>{entry.value}</p>

              {/* Optional: render attachment or file */}
              {entry.value?.endsWith(".pdf") && (
                <a
                  href="#"
                  className="text-blue-600 underline text-sm block mt-2"
                >
                  {entry.value} <span className="ml-1 text-muted-foreground">(1.69 MB)</span>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )


  // return <div>ACTIVITY FORMATTER GOES HERE: {activity.entries.length}</div>
}