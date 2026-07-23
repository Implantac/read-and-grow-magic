import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { dailyRoutine } from './constants';

export function RoutineTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>📋 Rotina Diária do Vendedor de Alta Performance</CardTitle>
          <CardDescription>Siga esta rotina para maximizar sua produtividade e resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyRoutine.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-sm font-mono font-bold text-primary min-w-[50px]">{item.time}</div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium">{item.task}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="text-base">💡 Regras de Ouro</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>🔥 <strong>Regra dos 5 minutos:</strong> Responda leads em até 5 min. Após 30 min, a taxa de conversão cai 80%.</li>
            <li>📞 <strong>Regra 10-3-1:</strong> 10 contatos geram 3 conversas que geram 1 oportunidade real.</li>
            <li>📝 <strong>Sem CRM, não aconteceu:</strong> Registre TUDO. Dados são sua arma.</li>
            <li>🎯 <strong>Foco no ICP:</strong> Não perca tempo com quem não é seu cliente ideal.</li>
            <li>🔄 <strong>Follow-up é lei:</strong> 80% das vendas acontecem após o 5º contato.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
