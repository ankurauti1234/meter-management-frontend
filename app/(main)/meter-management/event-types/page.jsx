"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash,
  Plus,
  Check,
  X,
  Bell,
  Queue,
  ListNumbers,
} from "@phosphor-icons/react";
import {
  fetchEventTypes,
  addMultipleEventTypes,
  updateEventType,
  deleteEventType,
} from "@/utils/event-types-apis";

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [filteredEventTypes, setFilteredEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newEventTypes, setNewEventTypes] = useState([{ typeId: "", name: "", isAlert: false, priority: "low" }]);
  const [editingEventType, setEditingEventType] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    fetchEventTypesData();
  }, []);

  useEffect(() => {
    const filtered = eventTypes.filter(
      (eventType) =>
        eventType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eventType.typeId.toString().includes(searchTerm)
    );
    setFilteredEventTypes(filtered);
  }, [eventTypes, searchTerm]);

  const fetchEventTypesData = async () => {
    try {
      setLoading(true);
      const data = await fetchEventTypes();
      setEventTypes(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch event types. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEventTypes = async () => {
    try {
      await addMultipleEventTypes(newEventTypes);
      setNewEventTypes([{ typeId: "", name: "", isAlert: false, priority: "low" }]);
      setAddDialogOpen(false);
      fetchEventTypesData();
      toast({
        title: "Success",
        description: "Event types added successfully!",
        variant: "success",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add event types.",
      });
    }
  };

  const handleUpdateEventType = async () => {
    try {
      // Create the update data object without priority initially
      const updateData = {
        typeId: editingEventType.typeId,
        name: editingEventType.name,
        isAlert: editingEventType.isAlert,
      };
  
      // Only include priority if isAlert is true
      if (editingEventType.isAlert) {
        updateData.priority = editingEventType.priority;
      }
  
      await updateEventType(editingEventType._id, updateData);
      setEditingEventType(null);
      fetchEventTypesData();
      toast({
        title: "Success",
        description: "Event type updated successfully!",
        variant: "success",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update event type.",
      });
    }
  };

  const handleDeleteEventType = async () => {
    try {
      await deleteEventType(eventTypeToDelete._id);
      setDeleteDialogOpen(false);
      setEventTypeToDelete(null);
      fetchEventTypesData();
      toast({
        title: "Success",
        description: "Event type deleted successfully!",
        variant: "success",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete event type.",
      });
    }
  };

  const addNewEventTypeRow = () => {
    setNewEventTypes([...newEventTypes, { typeId: "", name: "", isAlert: false, priority: "low" }]);
  };

  const updateNewEventType = (index, field, value) => {
    const updated = [...newEventTypes];
    updated[index][field] = value;
    setNewEventTypes(updated);
  };

  const removeNewEventTypeRow = (index) => {
    setNewEventTypes(newEventTypes.filter((_, i) => i !== index));
  };

  const isAddButtonDisabled = newEventTypes.some((et) => !et.typeId || !et.name);

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ListNumbers className="text-primary" size={20} weight="duotone" />
              Event Types
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <ListNumbers className="text-primary" size={20} weight="duotone" />
              Event Types
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {filteredEventTypes.length} event types shown
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-64 bg-background/50 border-muted"
            />
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary hover:bg-primary/90 flex items-center gap-2">
                  <Plus size={16} weight="duotone" />
                  Add Event Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[750px] rounded-xl shadow-xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold text-primary">
                    Add Event Types
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-6 py-4">
                    {newEventTypes.map((eventType, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 pl-2 bg-muted/30 p-4 rounded-lg"
                      >
                        <Input
                          placeholder="Event ID"
                          value={eventType.typeId}
                          onChange={(e) => updateNewEventType(index, "typeId", e.target.value)}
                          type="number"
                          className="h-10 w-1/5 rounded-lg border-primary/20"
                        />
                        <Input
                          placeholder="Event Name"
                          value={eventType.name}
                          onChange={(e) => updateNewEventType(index, "name", e.target.value)}
                          className="h-10 w-2/5 rounded-lg border-primary/20"
                        />
                        <div className="flex items-center space-x-2 w-1/5">
                          <Checkbox
                            id={`isAlert-${index}`}
                            checked={eventType.isAlert}
                            onCheckedChange={(checked) =>
                              updateNewEventType(index, "isAlert", checked)
                            }
                            className="border-primary/50 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor={`isAlert-${index}`} className="text-sm font-medium">
                            Is Alert
                          </Label>
                        </div>
                        <Select
                          value={eventType.priority}
                          onValueChange={(value) => updateNewEventType(index, "priority", value)}
                          disabled={!eventType.isAlert}
                        >
                          <SelectTrigger className="h-10 w-1/5">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        {newEventTypes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNewEventTypeRow(index)}
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full"
                          >
                            <X size={20} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 flex justify-between px-4 pb-4">
                  <Button
                    variant="outline"
                    onClick={addNewEventTypeRow}
                    className="rounded-lg border-primary/30 hover:bg-primary/10 transition-all"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Another
                  </Button>
                  <Button
                    onClick={handleAddEventTypes}
                    disabled={isAddButtonDisabled}
                    className="rounded-lg bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Check size={16} className="mr-2" />
                    Save All
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Event ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredEventTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      {searchTerm
                        ? "No matching event types found."
                        : "No event types available. Add some to get started!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEventTypes.map((eventType) => (
                    <TableRow
                      key={eventType._id}
                      className={`${
                        eventType.isAlert ? "bg-red-50/50" : ""
                      } hover:bg-muted/10`}
                    >
                      <TableCell className="font-medium">{eventType.typeId}</TableCell>
                      <TableCell>{eventType.name}</TableCell>
                      <TableCell>
                        {eventType.isAlert && (
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Bell size={14} />
                            Alert
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {eventType.isAlert && (
                          <Badge variant={getPriorityBadgeVariant(eventType.priority)}>
                            {eventType.priority.charAt(0).toUpperCase() + eventType.priority.slice(1)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-muted hover:bg-muted"
                                onClick={() => setEditingEventType(eventType)}
                              >
                                <Pencil size={16} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-xl shadow-xl">
                              <DialogHeader className="border-b pb-4">
                                <DialogTitle className="text-xl font-semibold text-primary">
                                  Edit Event Type
                                </DialogTitle>
                              </DialogHeader>
                              {editingEventType && (
                                <div className="space-y-6 py-4">
                                  <div>
                                    <Label className="text-sm font-medium">Event ID</Label>
                                    <Input
                                      placeholder="Event ID"
                                      value={editingEventType.typeId}
                                      onChange={(e) =>
                                        setEditingEventType({
                                          ...editingEventType,
                                          typeId: e.target.value,
                                        })
                                      }
                                      type="number"
                                      className="h-10 mt-1 rounded-lg border-primary/20"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Name</Label>
                                    <Input
                                      placeholder="Name"
                                      value={editingEventType.name}
                                      onChange={(e) =>
                                        setEditingEventType({
                                          ...editingEventType,
                                          name: e.target.value,
                                        })
                                      }
                                      className="h-10 mt-1 rounded-lg border-primary/20"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="isAlert-edit"
                                      checked={editingEventType.isAlert}
                                      onCheckedChange={(checked) =>
                                        setEditingEventType({
                                          ...editingEventType,
                                          isAlert: checked,
                                        })
                                      }
                                      className="border-primary/50 data-[state=checked]:bg-primary"
                                    />
                                    <Label
                                      htmlFor="isAlert-edit"
                                      className="text-sm font-medium"
                                    >
                                      Is Alert
                                    </Label>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Priority</Label>
                                    <Select
                                      value={editingEventType.priority}
                                      onValueChange={(value) =>
                                        setEditingEventType({
                                          ...editingEventType,
                                          priority: value,
                                        })
                                      }
                                      disabled={!editingEventType.isAlert}
                                    >
                                      <SelectTrigger className="h-10 mt-1">
                                        <SelectValue placeholder="Priority" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                              <DialogFooter className="mt-6 flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingEventType(null)}
                                  className="rounded-lg border-muted/30 hover:bg-muted/10"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleUpdateEventType}
                                  className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
                                >
                                  Save
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10 transition-all"
                            onClick={() => {
                              setEventTypeToDelete(eventType);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredEventTypes.length} event types
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-destructive">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the event type{" "}
              <span className="font-semibold">"{eventTypeToDelete?.name}"</span> (ID:{" "}
              {eventTypeToDelete?.typeId})? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-lg border-muted/30 hover:bg-muted/10"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEventType}
              className="rounded-lg hover:bg-destructive/90 transition-all"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}