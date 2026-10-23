from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional

@dataclass
class Pedido:
    cliente_id: int
    direccion_entrega: str
    total: Decimal
    id: Optional[int] = None
    estado: str = "pendiente"
    fecha_creacion: Optional[datetime] = None
    