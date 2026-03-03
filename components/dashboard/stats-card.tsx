import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  description?: string
  value: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

export function StatsCard({
  title,
  description,
  value,
  icon: Icon,
  trend,
  onClick
}: StatsCardProps) {
  return (
    <Card className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          {Icon && <Icon className="h-4 w-4 text-primary" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mes anterior
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
