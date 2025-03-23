// app/households/add/page.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { House, Envelope, Phone, User, Plus } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function AddHousehold() {
  const [hhid, setHhid] = useState(null);
  const [maxMembers, setMaxMembers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Form setup
  const form = useForm({
    defaultValues: {
      hh_email: "",
      hh_phone: "",
      max_members: "",
      max_submeters: "",
      Address: "",
      City: "",
      State: "",
      Region: "",
      TVOwnership: "",
      NoOfTVs: "",
      members: [],
    },
  });

  // Fetch latest HHID on mount
  useEffect(() => {
    const fetchLatestHHID = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/households`);
        const lastHHID = response.data.households.length > 0
          ? Math.max(...response.data.households.map(h => h.HHID))
          : 999;
        setHhid(lastHHID + 1);
      } catch (err) {
        setError("Failed to fetch latest HHID");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch HHID",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchLatestHHID();
  }, [toast]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        max_members: parseInt(data.max_members),
        max_submeters: parseInt(data.max_submeters),
        NoOfTVs: data.NoOfTVs ? parseInt(data.NoOfTVs) : undefined,
        members: data.members.map(member => ({
          ...member,
          Age: parseInt(member.Age),
          NumberOfChildren: member.NumberOfChildren ? parseInt(member.NumberOfChildren) : undefined,
          HoursOfTVWatchedDaily: member.HoursOfTVWatchedDaily ? parseInt(member.HoursOfTVWatchedDaily) : undefined,
          NumberOfCreditCards: member.NumberOfCreditCards ? parseInt(member.NumberOfCreditCards) : undefined,
          SocialMediaUsage: member.SocialMediaUsage ? parseInt(member.SocialMediaUsage) : undefined,
          AdExposure: member.AdExposure ? parseInt(member.AdExposure) : undefined,
        })),
      };

      const response = await axios.post(`${API_URL}/households/add`, payload);
      
      toast({
        title: "Success",
        description: "Household added successfully",
      });
      form.reset();
      setMaxMembers(0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add household");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to add household",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update member cards when max_members changes
  const handleMaxMembersChange = (value) => {
    const num = parseInt(value) || 0;
    setMaxMembers(num);
    const currentMembers = form.getValues("members");
    const newMembers = Array(num).fill().map((_, i) => 
      currentMembers[i] || { 
        Name: "", 
        Age: "", 
        Gender: "",
        MiddleName: "",
        LastName: "",
        EconomicBracket: "",
        PhoneNumber: "",
        AlternativePhoneNumber: "",
        EducationLevel: "",
        Occupation: "",
        MaritalStatus: "",
        NumberOfChildren: "",
        LanguageSpoken: "",
        StreamingServiceSubscription: "",
        PreferredTVGenre: "",
        HoursOfTVWatchedDaily: "",
        PetOwner: "",
        TypeOfPet: "",
        CarOwner: "",
        CarBrand: "",
        CarType: "",
        CreditCardUser: "",
        DebitCardUser: "",
        UPIUser: "",
        InvestmentInStocksMutualFunds: "",
        HomeOwnership: "",
        NumberOfCreditCards: "",
        PreferredShoppingMode: "",
        PreferredEcommercePlatform: "",
        FrequencyOfOnlineShopping: "",
        FrequencyOfDiningOut: "",
        FrequencyOfTravel: "",
        HealthInsurance: "",
        LifeInsurance: "",
        PreferredModeOfTransport: "",
        SocialMediaUsage: "",
        AdExposure: "",
        LikelihoodToBuyAfterAdExposure: "",
        PreferredAdCategories: "",
        ProductsBoughtAfterAdExposure: "",
        BrandsPreferredBasedOnAds: "",
        InfluenceOfTVShowsOnPurchases: "",
        InfluenceOfStreamingContentOnPurchases: "",
        PreferredProductCategories: "",
        PreferredBrands: "",
        LikelihoodToBuyBasedOnTVShows: "",
        LikelihoodToBuyBasedOnStreamingContent: ""
      }
    );
    form.setValue("members", newMembers);
  };

  if (loading && !hhid) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <House size={24} />
            Add New Household (HHID: {hhid || "Loading..."})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Household Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hh_email"
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <Input className="pl-10" placeholder="Email" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hh_phone"
                  rules={{ 
                    required: "Phone is required",
                    pattern: { value: /^\d{10}$/, message: "Phone must be 10 digits" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <Input className="pl-10" placeholder="Phone" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_members"
                  rules={{ 
                    required: "Max members is required",
                    min: { value: 1, message: "Minimum 1 member required" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Members</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <Input 
                            type="number" 
                            className="pl-10" 
                            placeholder="Max Members" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleMaxMembersChange(e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_submeters"
                  rules={{ required: "Max submeters is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Submeters</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Max Submeters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Address" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="City"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="State"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Region" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="TVOwnership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TV Ownership (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="NoOfTVs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of TVs (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Number of TVs" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Member Accordion */}
              {maxMembers > 0 && (
                <div className="space-y-4">
                  <Label>Members</Label>
                  <Accordion type="single" collapsible className="w-full">
                    {Array.from({ length: maxMembers }).map((_, index) => (
                      <AccordionItem key={index} value={`member-${index}`}>
                        <AccordionTrigger>Member {index + 1}</AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`members.${index}.Name`}
                              rules={{ required: "Name is required" }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Name" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.Age`}
                              rules={{ 
                                required: "Age is required",
                                min: { value: 0, message: "Age cannot be negative" }
                              }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Age" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.Gender`}
                              rules={{ required: "Gender is required" }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.MiddleName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Middle Name (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Middle Name" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LastName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Last Name" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.EconomicBracket`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Economic Bracket (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Economic Bracket" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PhoneNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Phone Number" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.AlternativePhoneNumber`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Alt Phone Number (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Alternative Phone" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.EducationLevel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Education Level (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Education Level" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.Occupation`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Occupation (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Occupation" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.MaritalStatus`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Marital Status (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Single">Single</SelectItem>
                                      <SelectItem value="Married">Married</SelectItem>
                                      <SelectItem value="Divorced">Divorced</SelectItem>
                                      <SelectItem value="Widowed">Widowed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.NumberOfChildren`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>No. of Children (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Number of Children" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LanguageSpoken`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Language Spoken (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Language Spoken" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.StreamingServiceSubscription`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Streaming Sub (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Streaming Subscription" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredTVGenre`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TV Genre (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Preferred TV Genre" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.HoursOfTVWatchedDaily`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TV Hours Daily (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Hours of TV" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PetOwner`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pet Owner (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.TypeOfPet`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type of Pet (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Type of Pet" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.CarOwner`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Car Owner (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.CarBrand`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Car Brand (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Car Brand" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.CarType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Car Type (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Car Type" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.CreditCardUser`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credit Card User (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.DebitCardUser`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Debit Card User (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.UPIUser`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>UPI User (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.InvestmentInStocksMutualFunds`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stocks/MF (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.HomeOwnership`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Home Ownership (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.NumberOfCreditCards`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>No. of Credit Cards (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Number of Credit Cards" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredShoppingMode`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Shopping Mode (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Online">Online</SelectItem>
                                      <SelectItem value="Offline">Offline</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredEcommercePlatform`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>E-commerce Platform (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="E-commerce Platform" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.FrequencyOfOnlineShopping`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Online Shopping Freq (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Daily">Daily</SelectItem>
                                      <SelectItem value="Weekly">Weekly</SelectItem>
                                      <SelectItem value="Monthly">Monthly</SelectItem>
                                      <SelectItem value="Rarely">Rarely</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.FrequencyOfDiningOut`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dining Out Freq (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Daily">Daily</SelectItem>
                                      <SelectItem value="Weekly">Weekly</SelectItem>
                                      <SelectItem value="Monthly">Monthly</SelectItem>
                                      <SelectItem value="Rarely">Rarely</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.FrequencyOfTravel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Travel Freq (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Daily">Daily</SelectItem>
                                      <SelectItem value="Weekly">Weekly</SelectItem>
                                      <SelectItem value="Monthly">Monthly</SelectItem>
                                      <SelectItem value="Rarely">Rarely</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.HealthInsurance`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Health Insurance (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LifeInsurance`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Life Insurance (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredModeOfTransport`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Transport Mode (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Transport Mode" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.SocialMediaUsage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Social Media Usage (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Hours" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.AdExposure`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ad Exposure (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="Number of Ads" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LikelihoodToBuyAfterAdExposure`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Likelihood to Buy (Ads) (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredAdCategories`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ad Categories (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ad Categories" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.ProductsBoughtAfterAdExposure`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Products from Ads (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Products" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.BrandsPreferredBasedOnAds`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Brands (Ads) (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Brands" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.InfluenceOfTVShowsOnPurchases`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TV Show Influence (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.InfluenceOfStreamingContentOnPurchases`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Streaming Influence (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredProductCategories`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Categories (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Categories" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.PreferredBrands`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preferred Brands (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Brands" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LikelihoodToBuyBasedOnTVShows`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Likelihood (TV) (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`members.${index}.LikelihoodToBuyBasedOnStreamingContent`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Likelihood (Streaming) (Optional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="High">High</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {error && <p className="text-red-500">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Household
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}