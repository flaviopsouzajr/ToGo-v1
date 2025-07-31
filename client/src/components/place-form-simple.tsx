import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertPlaceSchema, type InsertPlace, type PlaceType, type PlaceWithType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { states, getCitiesByState } from "@/lib/estados-cidades";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "./star-rating";
import { Tag } from "lucide-react";

interface PlaceFormProps {
  onSuccess?: () => void;
  editingPlace?: PlaceWithType | null;
}

export function PlaceFormSimple({ onSuccess, editingPlace }: PlaceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");

  const form = useForm<InsertPlace>({
    resolver: zodResolver(insertPlaceSchema),
    defaultValues: {
      name: "",
      typeId: 0,
      stateId: 0,
      stateName: "",
      cityId: 0,
      cityName: "",
      address: "",
      description: "",
      instagramProfile: "",
      hasRodizio: false,
      petFriendly: false,
      recommendToFriends: false,
      isVisited: false,
      tags: [],
    },
  });

  // Pre-fill form when editing a place
  useEffect(() => {
    if (editingPlace) {
      const formData = {
        name: editingPlace.name,
        typeId: editingPlace.typeId,
        stateId: editingPlace.stateId,
        stateName: editingPlace.stateName,
        cityId: editingPlace.cityId,
        cityName: editingPlace.cityName,
        address: editingPlace.address || "",
        description: editingPlace.description || "",
        instagramProfile: editingPlace.instagramProfile || "",
        hasRodizio: editingPlace.hasRodizio || false,
        petFriendly: editingPlace.petFriendly || false,
        recommendToFriends: editingPlace.recommendToFriends || false,
        isVisited: editingPlace.isVisited || false,
        rating: editingPlace.rating ? parseFloat(editingPlace.rating) : undefined,
        tags: editingPlace.tags || [],
      };
      
      form.reset(formData);
      setSelectedState(editingPlace.stateId.toString());
      setTagsInput(editingPlace.tags ? editingPlace.tags.join(", ") : "");
    } else {
      form.reset({
        name: "",
        typeId: 0,
        stateId: 0,
        stateName: "",
        cityId: 0,
        cityName: "",
        address: "",
        description: "",
        instagramProfile: "",
        hasRodizio: false,
        petFriendly: false,
        recommendToFriends: false,
        isVisited: false,
        tags: [],
      });
      setSelectedState("");
      setTagsInput("");
    }
  }, [editingPlace, form]);

  const { data: placeTypes = [] } = useQuery<PlaceType[]>({
    queryKey: ["/api/place-types"],
  });

  const selectedPlaceType = placeTypes.find(t => t.id === form.watch("typeId"));
  const isRestaurant = selectedPlaceType?.name === "Restaurante";
  const cities = selectedState ? getCitiesByState(selectedState) : [];

  const createPlaceMutation = useMutation({
    mutationFn: async (data: InsertPlace) => {
      return await apiRequest("/api/places", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Lugar cadastrado com sucesso!",
        description: "O lugar foi adicionado à sua lista.",
      });
      form.reset();
      setTagsInput("");
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

  const updatePlaceMutation = useMutation({
    mutationFn: async (data: InsertPlace) => {
      if (!editingPlace) throw new Error("No place to edit");
      return await apiRequest(`/api/places/${editingPlace.id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Lugar atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar lugar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPlace) => {
    // Process tags
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const submissionData = {
      ...data,
      tags,
    };

    if (editingPlace) {
      updatePlaceMutation.mutate(submissionData);
    } else {
      createPlaceMutation.mutate(submissionData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Endereço completo (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o lugar, suas características, o que oferece..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="instagramProfile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="@perfil ou URL do Instagram" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avaliação</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <StarRating
                      rating={field.value || 0}
                      onRatingChange={field.onChange}
                      interactive={true}
                      size="lg"
                    />
                    <span className="text-sm text-gray-500">
                      {field.value ? `${field.value}/5` : "Não avaliado"}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel className="text-base font-medium">Tags</FormLabel>
          <FormDescription className="text-sm text-gray-500 mb-3">
            Adicione tags separadas por vírgula (ex: família, romântico, vista para o mar)
          </FormDescription>
          <div className="space-y-3">
            <Input
              placeholder="Digite as tags separadas por vírgula"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            {tagsInput && (
              <div className="flex flex-wrap gap-2">
                {tagsInput.split(',').map((tag, index) => {
                  const cleanTag = tag.trim();
                  return cleanTag ? (
                    <div key={index} className="flex items-center space-x-1 bg-togo-lightest text-togo-primary px-2 py-1 rounded-full text-sm">
                      <Tag className="w-3 h-3" />
                      <span>{cleanTag}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isRestaurant && (
            <FormField
              control={form.control}
              name="hasRodizio"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Tem Rodízio
                    </FormLabel>
                    <FormDescription>
                      Marque se o restaurante oferece rodízio
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="petFriendly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Pet Friendly 🐾
                  </FormLabel>
                  <FormDescription>
                    Marque se o local aceita animais de estimação
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="recommendToFriends"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Indicação para Amigos ❤️
                  </FormLabel>
                  <FormDescription>
                    Compartilhe este lugar com seus amigos
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisited"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Já Visitei
                  </FormLabel>
                  <FormDescription>
                    Marque se você já visitou este lugar
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-togo-primary hover:bg-togo-secondary"
          disabled={createPlaceMutation.isPending || updatePlaceMutation.isPending}
        >
          {createPlaceMutation.isPending || updatePlaceMutation.isPending 
            ? (editingPlace ? "Atualizando..." : "Cadastrando...") 
            : (editingPlace ? "Atualizar Lugar" : "Cadastrar Lugar")
          }
        </Button>
      </form>
    </Form>
  );
}