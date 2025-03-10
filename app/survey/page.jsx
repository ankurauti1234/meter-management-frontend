"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const householdSchema = z.object({
  hh_email: z.string().email(),
  hh_phone: z.string().min(10),
  Address: z.string().min(1),
  max_members: z.number().min(1),
});

const memberSchema = z.object({
  Name: z.string().min(1),
  Age: z.number().min(1),
  Gender: z.enum(['Male', 'Female', 'Other']),
  // Optional fields can be added here as z.string().optional(), etc.
});

export default function Home() {
  const [hhid, setHhid] = useState(null);
  const [household, setHousehold] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const householdForm = useForm({
    resolver: zodResolver(householdSchema),
    defaultValues: { hh_email: '', hh_phone: '', Address: '', max_members: 1 }
  });

  const memberForm = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: { Name: '', Age: '', Gender: '' }
  });

  // Start survey
  const startSurvey = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/survey/start');
      setHhid(response.data.HHID);
      fetchHousehold(response.data.HHID);
    } catch (error) {
      console.error('Error starting survey:', error);
    }
  };

  // Fetch household details
  const fetchHousehold = async (hhid) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/survey/household/${hhid}`);
      setHousehold(response.data);
    } catch (error) {
      console.error('Error fetching household:', error);
    }
  };

  // Submit household details
  const onHouseholdSubmit = async (data) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/survey/household/${hhid}`, data);
      setHousehold(response.data);
    } catch (error) {
      console.error('Error updating household:', error);
    }
  };

  // Submit member details
  const onMemberSubmit = async (data) => {
    try {
      const mmid = selectedMember || `M${(household?.members.length || 0) + 1}`;
      await axios.put(`http://localhost:5000/api/survey/household/${hhid}/member/${mmid}`, data);
      fetchHousehold(hhid);
      setSelectedMember(null);
      memberForm.reset();
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Household Survey</h1>

      {!hhid ? (
        <Button onClick={startSurvey}>Start New Survey</Button>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Household {hhid}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...householdForm}>
                <form onSubmit={householdForm.handleSubmit(onHouseholdSubmit)} className="space-y-4">
                  <FormField
                    control={householdForm.control}
                    name="hh_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={householdForm.control}
                    name="hh_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={householdForm.control}
                    name="Address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={householdForm.control}
                    name="max_members"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Members</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Save Household Details</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {household?.max_members > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Members</h2>
                {Array.from({ length: household.max_members }, (_, i) => (
                  <Button
                    key={i}
                    variant={selectedMember === `M${i + 1}` ? "default" : "outline"}
                    className="w-full mb-2"
                    onClick={() => setSelectedMember(`M${i + 1}`)}
                  >
                    Member {i + 1} {household.members[i]?.Name ? `- ${household.members[i].Name}` : ''}
                  </Button>
                ))}
              </div>

              {selectedMember && (
                <Card>
                  <CardHeader>
                    <CardTitle>Member {selectedMember}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...memberForm}>
                      <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-4">
                        <FormField
                          control={memberForm.control}
                          name="Name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={memberForm.control}
                          name="Age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={memberForm.control}
                          name="Gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Add more optional fields here as needed */}
                        <Button type="submit">Save Member Details</Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}