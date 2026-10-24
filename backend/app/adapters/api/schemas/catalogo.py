from pydantic import BaseModel, ConfigDict, Field

class CategoriaCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = None

class CategoriaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    descripcion: str | None
    activa: bool

class ProductoCrear(BaseModel):
    categoria_id: int = Field(gt=0)
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = None
    precio: float = Field(gt=0, le=99999999.99)
    imagen_url: str | None = Field(default=None, max_length=500)
    disponible: bool = True

class ProductoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None
    precio: float
    imagen_url: str | None
    disponible: bool 

class ProductoActualizar(BaseModel):
    categoria_id: int | None = Field(default=None, gt=0)
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    descripcion: str | None = None
    precio: float | None = Field(default=None, gt=0, le=99999999.99)
    imagen_url: str | None = Field(default=None, max_length=500)
    disponible: bool | None = None
