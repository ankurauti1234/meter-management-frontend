import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarPlus,
  CalendarSync,
  Check,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  CircleEllipsis,
  CircleX,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Tag,
  UserCircle,
  X,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";

const AnimateChangeInHeight = ({ children, className }) => {
  const containerRef = useRef(null);
  const [height, setHeight] = useState("auto");

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        const observedHeight = entries[0].contentRect.height;
        setHeight(observedHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <motion.div
      className={cn(className, "overflow-hidden")}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.1, damping: 0.2, ease: "easeIn" }}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
};

const FILTER_TYPES = {
  STATUS: "Status",
  ASSIGNEE: "Assignee",
  LABELS: "Labels",
  PRIORITY: "Priority",
  DUE_DATE: "Due date",
  CREATED_DATE: "Created date",
  UPDATED_DATE: "Updated date",
};

const FILTER_OPERATORS = {
  IS: "is",
  IS_NOT: "is not",
  IS_ANY_OF: "is any of",
  INCLUDE: "include",
  DO_NOT_INCLUDE: "do not include",
  INCLUDE_ALL_OF: "include all of",
  INCLUDE_ANY_OF: "include any of",
  EXCLUDE_ALL_OF: "exclude all of",
  EXCLUDE_IF_ANY_OF: "exclude if any of",
  BEFORE: "before",
  AFTER: "after",
};

const STATUSES = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const ASSIGNEES = {
  ANDREW_LUO: "Andrew Luo",
  NO_ASSIGNEE: "No assignee",
};

const LABELS = {
  BUG: "Bug",
  FEATURE: "Feature",
  HOTFIX: "Hotfix",
  RELEASE: "Release",
};

const PRIORITIES = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const DUE_DATES = {
  IN_THE_PAST: "in the past",
  IN_24_HOURS: "24 hours from now",
  IN_3_DAYS: "3 days from now",
  IN_1_WEEK: "1 week from now",
  IN_1_MONTH: "1 month from now",
  IN_3_MONTHS: "3 months from now",
};

const FilterIcon = ({ type }) => {
  switch (type) {
    case ASSIGNEES.ANDREW_LUO:
      return (
        <Avatar className="size-3.5 rounded-full text-[9px] text-white">
          <AvatarFallback className="bg-orange-300">AL</AvatarFallback>
        </Avatar>
      );
    case ASSIGNEES.NO_ASSIGNEE:
      return <UserCircle className="size-3.5" />;
    case FILTER_TYPES.STATUS:
      return <CircleDashed className="size-3.5" />;
    case FILTER_TYPES.ASSIGNEE:
      return <UserCircle className="size-3.5" />;
    case FILTER_TYPES.LABELS:
      return <Tag className="size-3.5" />;
    case FILTER_TYPES.PRIORITY:
      return <SignalHigh className="size-3.5" />;
    case FILTER_TYPES.DUE_DATE:
      return <Calendar className="size-3.5" />;
    case FILTER_TYPES.CREATED_DATE:
      return <CalendarPlus className="size-3.5" />;
    case FILTER_TYPES.UPDATED_DATE:
      return <CalendarSync className="size-3.5" />;
    case STATUSES.BACKLOG:
      return <CircleDashed className="size-3.5 text-muted-foreground" />;
    case STATUSES.TODO:
      return <Circle className="size-3.5 text-primary" />;
    case STATUSES.IN_PROGRESS:
      return <CircleDotDashed className="size-3.5 text-yellow-400" />;
    case STATUSES.IN_REVIEW:
      return <CircleEllipsis className="size-3.5 text-green-400" />;
    case STATUSES.DONE:
      return <CircleCheck className="size-3.5 text-blue-400" />;
    case STATUSES.CANCELLED:
      return <CircleX className="size-3.5 text-muted-foreground" />;
    case PRIORITIES.URGENT:
      return <CircleAlert className="size-3.5" />;
    case PRIORITIES.HIGH:
      return <SignalHigh className="size-3.5" />;
    case PRIORITIES.MEDIUM:
      return <SignalMedium className="size-3.5" />;
    case PRIORITIES.LOW:
      return <SignalLow className="size-3.5" />;
    case LABELS.BUG:
      return <div className="bg-red-400 rounded-full size-2.5" />;
    case LABELS.FEATURE:
      return <div className="bg-blue-400 rounded-full size-2.5" />;
    case LABELS.HOTFIX:
      return <div className="bg-amber-400 rounded-full size-2.5" />;
    case LABELS.RELEASE:
      return <div className="bg-green-400 rounded-full size-2.5" />;
  }
};

const filterViewOptions = [
  [
    { name: FILTER_TYPES.STATUS, icon: <FilterIcon type={FILTER_TYPES.STATUS} /> },
    { name: FILTER_TYPES.ASSIGNEE, icon: <FilterIcon type={FILTER_TYPES.ASSIGNEE} /> },
    { name: FILTER_TYPES.LABELS, icon: <FilterIcon type={FILTER_TYPES.LABELS} /> },
    { name: FILTER_TYPES.PRIORITY, icon: <FilterIcon type={FILTER_TYPES.PRIORITY} /> },
  ],
  [
    { name: FILTER_TYPES.DUE_DATE, icon: <FilterIcon type={FILTER_TYPES.DUE_DATE} /> },
    { name: FILTER_TYPES.CREATED_DATE, icon: <FilterIcon type={FILTER_TYPES.CREATED_DATE} /> },
    { name: FILTER_TYPES.UPDATED_DATE, icon: <FilterIcon type={FILTER_TYPES.UPDATED_DATE} /> },
  ],
];

const statusFilterOptions = Object.values(STATUSES).map((status) => ({
  name: status,
  icon: <FilterIcon type={status} />,
}));

const assigneeFilterOptions = Object.values(ASSIGNEES).map((assignee) => ({
  name: assignee,
  icon: <FilterIcon type={assignee} />,
}));

const labelFilterOptions = Object.values(LABELS).map((label) => ({
  name: label,
  icon: <FilterIcon type={label} />,
}));

const priorityFilterOptions = Object.values(PRIORITIES).map((priority) => ({
  name: priority,
  icon: <FilterIcon type={priority} />,
}));

const dateFilterOptions = Object.values(DUE_DATES).map((date) => ({
  name: date,
  icon: undefined,
}));

const filterViewToFilterOptions = {
  [FILTER_TYPES.STATUS]: statusFilterOptions,
  [FILTER_TYPES.ASSIGNEE]: assigneeFilterOptions,
  [FILTER_TYPES.LABELS]: labelFilterOptions,
  [FILTER_TYPES.PRIORITY]: priorityFilterOptions,
  [FILTER_TYPES.DUE_DATE]: dateFilterOptions,
  [FILTER_TYPES.CREATED_DATE]: dateFilterOptions,
  [FILTER_TYPES.UPDATED_DATE]: dateFilterOptions,
};

const filterOperators = ({ filterType, filterValues }) => {
  switch (filterType) {
    case FILTER_TYPES.STATUS:
    case FILTER_TYPES.ASSIGNEE:
    case FILTER_TYPES.PRIORITY:
      if (Array.isArray(filterValues) && filterValues.length > 1) {
        return [FILTER_OPERATORS.IS_ANY_OF, FILTER_OPERATORS.IS_NOT];
      } else {
        return [FILTER_OPERATORS.IS, FILTER_OPERATORS.IS_NOT];
      }
    case FILTER_TYPES.LABELS:
      if (Array.isArray(filterValues) && filterValues.length > 1) {
        return [
          FILTER_OPERATORS.INCLUDE_ANY_OF,
          FILTER_OPERATORS.INCLUDE_ALL_OF,
          FILTER_OPERATORS.EXCLUDE_ALL_OF,
          FILTER_OPERATORS.EXCLUDE_IF_ANY_OF,
        ];
      } else {
        return [FILTER_OPERATORS.INCLUDE, FILTER_OPERATORS.DO_NOT_INCLUDE];
      }
    case FILTER_TYPES.DUE_DATE:
    case FILTER_TYPES.CREATED_DATE:
    case FILTER_TYPES.UPDATED_DATE:
      if (filterValues?.includes(DUE_DATES.IN_THE_PAST)) {
        return [FILTER_OPERATORS.IS, FILTER_OPERATORS.IS_NOT];
      } else {
        return [FILTER_OPERATORS.BEFORE, FILTER_OPERATORS.AFTER];
      }
    default:
      return [];
  }
};

const FilterOperatorDropdown = ({ filterType, operator, filterValues, setOperator }) => {
  const operators = filterOperators({ filterType, filterValues });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="bg-muted hover:bg-muted/50 px-1.5 py-1 text-muted-foreground hover:text-primary transition shrink-0">
        {operator}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((op) => (
          <DropdownMenuItem key={op} onClick={() => setOperator(op)}>
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const FilterValueCombobox = ({ filterType, filterValues, setFilterValues }) => {
  const [open, setOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const commandInputRef = useRef(null);
  const nonSelectedFilterValues = filterViewToFilterOptions[filterType]?.filter(
    (filter) => !filterValues.includes(filter.name)
  );

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => setCommandInput(""), 200);
        }
      }}
    >
      <PopoverTrigger
        className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition text-muted-foreground hover:text-primary shrink-0"
      >
        <div className="flex gap-1.5 items-center">
          {filterType !== FILTER_TYPES.PRIORITY && (
            <div
              className={cn(
                "flex items-center flex-row",
                filterType === FILTER_TYPES.LABELS ? "-space-x-1" : "-space-x-1.5"
              )}
            >
              <AnimatePresence mode="popLayout">
                {filterValues?.slice(0, 3).map((value) => (
                  <motion.div
                    key={value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FilterIcon type={value} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {filterValues?.length === 1 ? filterValues?.[0] : `${filterValues?.length} selected`}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => setCommandInput(e.currentTarget.value)}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filterValues.map((value) => (
                  <CommandItem
                    key={value}
                    className="group flex gap-2 items-center"
                    onSelect={() => {
                      setFilterValues(filterValues.filter((v) => v !== value));
                      setTimeout(() => setCommandInput(""), 200);
                      setOpen(false);
                    }}
                  >
                    <Checkbox checked={true} />
                    <FilterIcon type={value} />
                    {value}
                  </CommandItem>
                ))}
              </CommandGroup>
              {nonSelectedFilterValues?.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {nonSelectedFilterValues.map((filter) => (
                      <CommandItem
                        className="group flex gap-2 items-center"
                        key={filter.name}
                        value={filter.name}
                        onSelect={(currentValue) => {
                          setFilterValues([...filterValues, currentValue]);
                          setTimeout(() => setCommandInput(""), 200);
                          setOpen(false);
                        }}
                      >
                        <Checkbox
                          checked={false}
                          className="opacity-0 group-data-[selected=true]:opacity-100"
                        />
                        {filter.icon}
                        <span className="text-accent-foreground">{filter.name}</span>
                        {filter.label && (
                          <span className="text-muted-foreground text-xs ml-auto">
                            {filter.label}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  );
};

const FilterValueDateCombobox = ({ filterType, filterValues, setFilterValues }) => {
  const [open, setOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const commandInputRef = useRef(null);

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setTimeout(() => setCommandInput(""), 200);
        }
      }}
    >
      <PopoverTrigger
        className="rounded-none px-1.5 py-1 bg-muted hover:bg-muted/50 transition text-muted-foreground hover:text-primary shrink-0"
      >
        {filterValues?.[0]}
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <AnimateChangeInHeight>
          <Command>
            <CommandInput
              placeholder={filterType}
              className="h-9"
              value={commandInput}
              onInputCapture={(e) => setCommandInput(e.currentTarget.value)}
              ref={commandInputRef}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filterViewToFilterOptions[filterType].map((filter) => (
                  <CommandItem
                    className="group flex gap-2 items-center"
                    key={filter.name}
                    value={filter.name}
                    onSelect={(currentValue) => {
                      setFilterValues([currentValue]);
                      setTimeout(() => setCommandInput(""), 200);
                      setOpen(false);
                    }}
                  >
                    <span className="text-accent-foreground">{filter.name}</span>
                    <Check
                      className={cn(
                        "ml-auto",
                        filterValues.includes(filter.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </AnimateChangeInHeight>
      </PopoverContent>
    </Popover>
  );
};

export default function Filters({ filters, setFilters }) {
  return (
    <div className="flex gap-2">
      {filters
        .filter((filter) => filter.value?.length > 0)
        .map((filter) => (
          <div key={filter.id} className="flex gap-[1px] items-center text-xs">
            <div className="flex gap-1.5 shrink-0 rounded-l bg-muted px-1.5 py-1 items-center">
              <FilterIcon type={filter.type} />
              {filter.type}
            </div>
            <FilterOperatorDropdown
              filterType={filter.type}
              operator={filter.operator}
              filterValues={filter.value}
              setOperator={(operator) =>
                setFilters((prev) =>
                  prev.map((f) => (f.id === filter.id ? { ...f, operator } : f))
                )
              }
            />
            {filter.type === FILTER_TYPES.CREATED_DATE ||
            filter.type === FILTER_TYPES.UPDATED_DATE ||
            filter.type === FILTER_TYPES.DUE_DATE ? (
              <FilterValueDateCombobox
                filterType={filter.type}
                filterValues={filter.value}
                setFilterValues={(filterValues) =>
                  setFilters((prev) =>
                    prev.map((f) =>
                      f.id === filter.id ? { ...f, value: filterValues } : f
                    )
                  )
                }
              />
            ) : (
              <FilterValueCombobox
                filterType={filter.type}
                filterValues={filter.value}
                setFilterValues={(filterValues) =>
                  setFilters((prev) =>
                    prev.map((f) =>
                      f.id === filter.id ? { ...f, value: filterValues } : f
                    )
                  )
                }
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setFilters((prev) => prev.filter((f) => f.id !== filter.id))
              }
              className="bg-muted rounded-l-none rounded-r-sm h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted/50 transition shrink-0"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
    </div>
  );
}

export {
  AnimateChangeInHeight,
  FILTER_TYPES as FilterType,
  FILTER_OPERATORS as FilterOperator,
  STATUSES as Status,
  ASSIGNEES as Assignee,
  LABELS as Labels,
  PRIORITIES as Priority,
  DUE_DATES as DueDate,
  filterViewOptions,
  filterViewToFilterOptions,
};