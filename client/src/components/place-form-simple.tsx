import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPlaceSchema, type InsertPlace, type PlaceType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { states, getCitiesByState } from "@/lib/estados-cidades";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlaceFormProps {
  onSuccess?: () => void;
}

export function PlaceFormSimple({ onSuccess }: PlaceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("");

  const form = useForm<InsertPlace>({
    resolver: zodResolver(insertPlaceSchema),
    defaultValues: {
      name: "",
      typeId: 0,
      stateId: 0,
      stateName: "",
      cityId: 0,
      cityName: "",
    },
  });

  const { data: placeTypes = [] } = useQuery<PlaceType[]>({
    queryKey: ["/api/place-types"],
  });

  const cities = selectedState ? getCitiesByState(selectedState) : [];

  const createPlaceMutation = useMutation({
    mutationFn: async (data: InsertPlace) => {
      const res = await apiRequest("POST", "/api/places", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({
        title: "Lugar cadastrado com sucesso!",
        description: "O lugar foi adicionado à sua lista.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar lugar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlace) => {
    createPlaceMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Lugar</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do lugar" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {placeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select 
                onValueChange={(value) => {
                  const stateId = parseInt(value);
                  const state = states.find(s => s.id === value);
                  field.onChange(stateId);
                  form.setValue("stateName", state?.name || "");
                  setSelectedState(value);
                }}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedState && (
          <FormField
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const cityId = parseInt(value);
                    const city = cities.find(c => c.id === cityId);
                    field.onChange(cityId);
                    form.setValue("cityName", city?.name || "");
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full bg-togo-primary hover:bg-togo-secondary"
          disabled={createPlaceMutation.isPending}
        >
          {createPlaceMutation.isPending ? "Cadastrando..." : "Cadastrar Lugar"}
        </Button>
      </form>
    </Form>
  );
}