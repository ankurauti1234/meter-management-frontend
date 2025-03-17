import React from 'react'
import MeterStream from './meter'
import SubmeterStream from './submeter'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RemoteStream from './remote'

const Inventory = () => {
  return (
    <Tabs defaultValue="meters" className="w-full">
      <TabsList className="grid w-fit grid-cols-3">
        <TabsTrigger value="meters">Meters</TabsTrigger>
        <TabsTrigger value="submeters">Submeters</TabsTrigger>
        <TabsTrigger value="remotes">Remotes</TabsTrigger>
      </TabsList>
      <TabsContent value="meters">
        <MeterStream />
      </TabsContent>
      <TabsContent value="submeters">
        <SubmeterStream />
      </TabsContent>

      <TabsContent value="remotes">
        <RemoteStream />
      </TabsContent>
    </Tabs>
  )
}

export default Inventory