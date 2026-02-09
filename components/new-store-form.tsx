"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ChevronLeft, ChevronRight, Check, Store, User, CreditCard, Settings, Loader2, TrendingUp, Brain, Rocket, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { createStore } from "@/app/actions/store-actions"

const steps = [
  { id: 1, name: "Loja", icon: Store },
  { id: 2, name: "Cliente", icon: User },
  { id: 3, name: "Plano", icon: CreditCard },
  { id: 4, name: "Contas", icon: Settings },
]

const plans = [
  { id: "Start PRO GROWTH", name: "Start PRO GROWTH", products: 30, icon: TrendingUp, color: "text-emerald-500" },
  { id: "Pro VERTEBRA", name: "Pro VERTEBRA", products: 50, icon: Brain, color: "text-purple-500" },
  { id: "Scale VERTEBRA+ BR", name: "Scale VERTEBRA+ BR", products: 100, icon: Rocket, color: "text-blue-500" },
  { id: "Scale VERTEBRA+ GLOBAL", name: "Scale VERTEBRA+ GLOBAL", products: 100, icon: Zap, color: "text-orange-500" },
]

const accountsBrasil = [
  { id: "gmail", name: "Gmail" },
  { id: "shopify", name: "Shopify" },
  { id: "yampi", name: "Yampi" },
  { id: "hostinger", name: "Hostinger" },
  { id: "appmax", name: "Appmax" },
  { id: "hypersku", name: "HyperSKU" },
  { id: "dsers", name: "DSers" },
]

const accountsGlobal = [
  { id: "hostinger", name: "Hostinger" },
  { id: "hypersku", name: "HyperSKU" },
  { id: "shopify", name: "Shopify" },
  { id: "gmail", name: "Gmail" },
  { id: "dsers", name: "DSers" },
]

interface FormData {
  storeName: string
  storeNumber: string
  region: "brasil" | "global"
  customerName: string
  birthDate: string
  cpf: string
  address: string
  addressNumber: string
  cep: string
  plan: string
  driveLink: string
  accounts: Record<string, { login: string; password: string; enabled: boolean }>
}

function initializeAccounts(region: "brasil" | "global") {
  const accounts = region === "brasil" ? accountsBrasil : accountsGlobal
  return accounts.reduce(
    (acc, account) => ({ ...acc, [account.id]: { login: "", password: "", enabled: false } }),
    {} as Record<string, { login: string; password: string; enabled: boolean }>,
  )
}

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
}

function formatCEP(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 5) return numbers
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
}

function formatDateInputBR(value: string) {
  const numbers = value.replace(/\D/g, "")
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
}

function parseDateBRToISO(dateBR: string) {
  const parts = dateBR.split("/")
  if (parts.length !== 3) return ""
  const [day, month, year] = parts
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return ""
  return `${year}-${month}-${day}`
}

export function NewStoreForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<FormData>({
    storeName: "",
    storeNumber: "",
    region: "brasil",
    customerName: "",
    birthDate: "",
    cpf: "",
    address: "",
    addressNumber: "",
    cep: "",
    plan: "",
    driveLink: "",
    accounts: initializeAccounts("brasil"),
  })
  const router = useRouter()

  const currentAccounts = formData.region === "brasil" ? accountsBrasil : accountsGlobal

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => {
      if (field === "region") {
        const regionValue = value as "brasil" | "global"
        return { ...prev, region: regionValue, accounts: initializeAccounts(regionValue) }
      }
      return { ...prev, [field]: value }
    })
  }

  const updateAccountData = (accountId: string, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      accounts: { ...prev.accounts, [accountId]: { ...prev.accounts[accountId], [field]: value } },
    }))
  }

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!formData.storeName.trim()) return "Nome da loja e obrigatorio"
      if (!formData.storeNumber.trim()) return "Numero da loja e obrigatorio"
    }
    if (step === 2) {
      if (!formData.customerName.trim()) return "Nome do cliente e obrigatorio"
      if (!formData.cpf.trim()) return "CPF e obrigatorio"
    }
    if (step === 3) {
      if (!formData.plan) return "Selecione um plano"
    }
    return null
  }

  const nextStep = () => {
    const validationError = validateStep(currentStep)
    if (validationError) { setError(validationError); return }
    setError(null)
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => { setError(null); if (currentStep > 1) setCurrentStep(currentStep - 1) }

  const handleSubmit = () => {
    const validationError = validateStep(currentStep)
    if (validationError) { setError(validationError); return }
    setError(null)
    startTransition(async () => {
      const dataToSave = { ...formData, birthDate: parseDateBRToISO(formData.birthDate) }
      const result = await createStore(dataToSave)
      if (result.success) { router.push("/dashboard") }
      else { setError(result.error || "Erro ao criar loja") }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Loja</h1>
        <p className="text-muted-foreground">Preencha as informacoes para cadastrar uma nova loja</p>
      </div>

      {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex items-center justify-between px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2", currentStep > step.id ? "bg-primary border-primary text-primary-foreground" : currentStep === step.id ? "border-primary text-primary bg-transparent" : "border-muted text-muted-foreground bg-transparent")}>
              {currentStep > step.id ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
            </div>
            <span className={cn("ml-2 text-sm hidden sm:inline", currentStep >= step.id ? "text-foreground" : "text-muted-foreground")}>{step.name}</span>
            {index < steps.length - 1 && <div className={cn("w-8 sm:w-16 h-0.5 mx-2", currentStep > step.id ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Informacoes basicas da loja"}
            {currentStep === 2 && "Dados do cliente responsavel"}
            {currentStep === 3 && "Selecione o plano desejado"}
            {currentStep === 4 && "Configure as contas de integracao"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Loja *</Label>
                  <Input value={formData.storeName} onChange={(e) => updateFormData("storeName", e.target.value)} placeholder="Digite o nome da loja" />
                </div>
                <div className="space-y-2">
                  <Label>Numero da Loja *</Label>
                  <Input value={formData.storeNumber} onChange={(e) => updateFormData("storeNumber", e.target.value)} placeholder="Ex: 001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link do Drive</Label>
                <Input value={formData.driveLink} onChange={(e) => updateFormData("driveLink", e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Regiao *</Label>
                <RadioGroup value={formData.region} onValueChange={(value) => updateFormData("region", value)} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="brasil" id="brasil" /><Label htmlFor="brasil">Brasil</Label></div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3"><RadioGroupItem value="global" id="global" /><Label htmlFor="global">Global</Label></div>
                </RadioGroup>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input value={formData.customerName} onChange={(e) => updateFormData("customerName", e.target.value)} placeholder="Nome do cliente" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data de Nascimento</Label><Input value={formData.birthDate} onChange={(e) => updateFormData("birthDate", formatDateInputBR(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10} /></div>
                <div className="space-y-2"><Label>CPF *</Label><Input value={formData.cpf} onChange={(e) => updateFormData("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} /></div>
              </div>
              <div className="space-y-2"><Label>Endereco</Label><Input value={formData.address} onChange={(e) => updateFormData("address", e.target.value)} placeholder="Rua, Avenida..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Numero</Label><Input value={formData.addressNumber} onChange={(e) => updateFormData("addressNumber", e.target.value)} placeholder="Numero" /></div>
                <div className="space-y-2"><Label>CEP</Label><Input value={formData.cep} onChange={(e) => updateFormData("cep", formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} /></div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <RadioGroup value={formData.plan} onValueChange={(value) => updateFormData("plan", value)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const IconComponent = plan.icon
                return (
                  <div key={plan.id} className={cn("flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors", formData.plan === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground")}>
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <IconComponent className={cn("h-5 w-5", plan.color)} />
                    <div><Label htmlFor={plan.id} className="cursor-pointer font-medium">{plan.name}</Label><p className="text-xs text-muted-foreground">{plan.products} produtos</p></div>
                  </div>
                )
              })}
            </RadioGroup>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              {currentAccounts.map((account) => (
                <div key={account.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id={account.id} checked={formData.accounts[account.id]?.enabled} onCheckedChange={(checked) => updateAccountData(account.id, "enabled", checked)} />
                    <Label htmlFor={account.id} className="font-medium">{account.name}</Label>
                  </div>
                  {formData.accounts[account.id]?.enabled && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div className="space-y-1"><Label className="text-xs">Login *</Label><Input value={formData.accounts[account.id]?.login || ""} onChange={(e) => updateAccountData(account.id, "login", e.target.value)} placeholder="Email ou usuario" /></div>
                      <div className="space-y-1"><Label className="text-xs">Senha *</Label><Input value={formData.accounts[account.id]?.password || ""} onChange={(e) => updateAccountData(account.id, "password", e.target.value)} placeholder="Senha da conta" /></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}><ChevronLeft className="h-4 w-4 mr-1" />Voltar</Button>
            {currentStep < 4 ? (
              <Button onClick={nextStep}>Proximo<ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</>) : (<><Check className="h-4 w-4 mr-2" />Finalizar</>)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
