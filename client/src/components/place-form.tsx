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

export function PlaceForm({ onSuccess, editingPlace }: PlaceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [itineraryFile, setItineraryFile] = useState<File | null>(null);

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
        mainImage: editingPlace.mainImage || "",
        hasRodizio: editingPlace.hasRodizio || false,
        isVisited: editingPlace.isVisited || false,
        rating: editingPlace.rating ? Math.round(parseFloat(editingPlace.rating) * 2) / 2 : undefined,
        tags: editingPlace.tags || [],
      };
      
      // Reset form with new values
      form.reset(formData);
      
      // Set additional state for the select components
      setSelectedState(editingPlace.stateId.toString());
      setTagsInput(editingPlace.tags ? editingPlace.tags.join(", ") : "");
      
      // Force update of form values for select fields
      setTimeout(() => {
        form.setValue("typeId", editingPlace.typeId);
        form.setValue("stateId", editingPlace.stateId);
        form.setValue("cityId", editingPlace.cityId);
      }, 0);
    } else {
      // Reset form when not editing
      form.reset({
        name: "",
        typeId: 0,
        stateId: 0,
        stateName: "",
        cityId: 0,
        cityName: "",
        description: "",
        instagramProfile: "",
        hasRodizio: false,
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

  // Initialize tags input when editing a place
  useEffect(() => {
    if (editingPlace?.tags && Array.isArray(editingPlace.tags)) {
      setTagsInput(editingPlace.tags.join(', '));
    }
  }, [editingPlace]);

  const selectedPlaceType = placeTypes.find(t => t.id === form.watch("typeId"));
  const isRestaurant = selectedPlaceType?.name === "Restaurante";
  const cities = selectedState ? getCitiesByState(selectedState) : [];

  const createPlaceMutation = useMutation({
    mutationFn: async (data: InsertPlace) => {
      // Se há arquivo de roteiro, usar FormData
      if (itineraryFile) {
        const formData = new FormData();
        
        // Adicionar todos os campos do formulário
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        
        // Adicionar o arquivo de roteiro
        formData.append('itineraryFile', itineraryFile);
        
        const res = await fetch("/api/places", {
          method: "POST",
          credentials: "include",
          body: formData
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      } else {
        // Usar JSON normal se não há arquivo
        return await apiRequest("/api/places", { method: "POST", body: data });
      }
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
      // Se há arquivo de roteiro, usar FormData
      if (itineraryFile) {
        const formData = new FormData();
        
        // Adicionar todos os campos do formulário
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, value.toString());
            }
          }
        });
        
        // Adicionar o arquivo de roteiro
        formData.append('itineraryFile', itineraryFile);
        
        const res = await fetch(`/api/places/${editingPlace!.id}`, {
          method: "PUT",
          credentials: "include",
          body: formData
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `HTTP error! status: ${res.status}`);
        }
        
        return res.json();
      } else {
        // Usar JSON normal se não há arquivo
        return await apiRequest(`/api/places/${editingPlace!.id}`, { method: "PUT", body: data });
      }
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
    // Process tags from input string
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    // Prepare data with tags
    const submitData = {
      ...data,
      tags: tags.length > 0 ? tags : []
    };

    if (editingPlace) {
      updatePlaceMutation.mutate(submitData);
    } else {
      createPlaceMutation.mutate(submitData);
    }
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    const stateName = states.find(s => s.id === stateId)?.name || "";
    form.setValue("stateId", parseInt(stateId));
    form.setValue("stateName", stateName);
    form.setValue("cityId", 0);
    form.setValue("cityName", "");
  };

  const handleCityChange = (cityId: string) => {
    const cityName = cities.find(c => c.id === parseInt(cityId))?.name || "";
    form.setValue("cityId", parseInt(cityId));
    form.setValue("cityName", cityName);
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
                <FormLabel>Nome do Lugar *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Restaurante do João" {...field} />
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
                <FormLabel>Tipo de Lugar *</FormLabel>
                <Select 
                  value={field.value ? field.value.toString() : ""} 
                  onValueChange={(value) => field.onChange(parseInt(value))}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="stateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado *</FormLabel>
                <Select 
                  value={selectedState} 
                  onValueChange={handleStateChange}
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

          <FormField
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade *</FormLabel>
                <Select 
                  value={field.value && field.value > 0 ? field.value.toString() : ""} 
                  onValueChange={handleCityChange} 
                  disabled={!selectedState}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedState ? "Selecione a cidade" : "Primeiro selecione o estado"
                      } />
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
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço (opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Rua das Flores, 123, Centro" 
                  {...field} 
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormDescription>
                Informe o endereço completo ou aproximado para facilitar a localização no Google Maps
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo de arquivo de roteiro - apenas para não-restaurantes */}
        {!isRestaurant && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anexar Roteiro (opcional)
            </label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setItineraryFile(file);
              }}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceitos: PDF, DOC, DOCX (máx. 10MB)
            </p>
          </div>
        )}

        {isRestaurant && (
          <div className="bg-togo-lightest p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Informações de Restaurante</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="instagramProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil do Instagram</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@restaurante_instagram" 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasRodizio"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Possui Rodízio?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o lugar..."
                  className="min-h-[100px]"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags/Categorias (opcional)
          </label>
          <Input
            placeholder="Ex: Praia, Aventura, Culinária Italiana (separadas por vírgula)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Digite as tags separadas por vírgula para categorizar o lugar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="mainImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Imagem Principal</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://exemplo.com/imagem.jpg" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Cole o link direto da imagem principal do lugar
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avaliação</FormLabel>
                <FormControl>
                  <StarRating
                    rating={field.value || 0}
                    interactive
                    onRatingChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isVisited"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Já foi visitado?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createPlaceMutation.isPending || updatePlaceMutation.isPending}
            className="bg-togo-primary hover:bg-togo-secondary"
          >
            {editingPlace 
              ? (updatePlaceMutation.isPending ? "Salvando..." : "Salvar Alterações")
              : (createPlaceMutation.isPending ? "Cadastrando..." : "Cadastrar Lugar")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
