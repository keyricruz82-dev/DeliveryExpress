import { useCallback, useEffect, useState } from 'react'
import {
  Bike,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  UtensilsCrossed,
  ListFilter,
} from 'lucide-react'
import './styles.css'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
).replace(/\/$/, '')

const roles = [
  {
    title: 'Portal del cliente',
    description:
      'Explorar productos, administrar el carrito y realizar pedidos.',
    icon: ShoppingBag,
    tag: 'RF-01 a RF-07',
  },
  {
    title: 'Administración',
    description:
      'Gestionar el catálogo, las órdenes, los repartidores y las estadísticas.',
    icon: ClipboardList,
    tag: 'RF-08 a RF-13',
  },
  {
    title: 'Portal del repartidor',
    description:
      'Consultar entregas asignadas y actualizar su estado.',
    icon: Bike,
    tag: 'RF-14 a RF-16',
  },
]

const estadosPedido = [
  'pendiente',
  'en preparación',
  'en camino',
  'entregado',
  'cancelado',
]

const filtrosPedido = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'en preparación', etiqueta: 'En preparación' },
  { valor: 'en camino', etiqueta: 'En camino' },
  { valor: 'entregado', etiqueta: 'Entregados' },
  { valor: 'cancelado', etiqueta: 'Cancelados' },
]

export default function App() {
  const [apiStatus, setApiStatus] = useState('Comprobando API…')
  const [pestanaActiva, setPestanaActiva] = useState('inicio')
  const [pedidos, setPedidos] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [actualizandoEstado, setActualizandoEstado] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const [clienteId, setClienteId] = useState('1')
  const [direccion, setDireccion] = useState('')
  const [total, setTotal] = useState('')

  const pedidosFiltrados =
    filtroEstado === 'todos'
      ? pedidos
      : pedidos.filter((pedido) => pedido.estado === filtroEstado)

  const cargarPedidos = useCallback(async () => {
    setCargando(true)
    setError('')

   
    try {
      const response = await fetch(`${API_URL}/pedidos`)

      if (!response.ok) {
        throw new Error('No se pudieron consultar los pedidos.')
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError(err.message || 'No fue posible conectar con el backend.')
    } finally {
      setCargando(false)
    }
  }, [])
  
  const cargarCatalogo = useCallback(async () => {
    try {
      const [respuestaProductos, respuestaCategorias] = await Promise.all([
        fetch(`${API_URL}/catalogo/productos`),
        fetch(`${API_URL}/catalogo/categorias`),
      ])

      if (!respuestaProductos.ok || !respuestaCategorias.ok) {
        throw new Error('No fue posible cargar el catálogo.')
      }

      const [datosProductos, datosCategorias] = await Promise.all([
        respuestaProductos.json(),
        respuestaCategorias.json(),
      ])

      setProductos(datosProductos)
      setCategorias(datosCategorias)
    } catch (err) {
      console.error('Error al cargar el catálogo:', err)
    }
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API no disponible')
        return response.json()
      }) 
      .then((data) => {
        setApiStatus(data.message || 'API conectada')
      })
      .catch(() => {
        setApiStatus('API no conectada. Inicia el backend.')
      }) 
    cargarPedidos()
    cargarCatalogo()               
  }, [cargarPedidos, cargarCatalogo])
  async function crearPedido(event) {
    event.preventDefault()
    setMensaje('') 
    setError('')

    const cliente = Number(clienteId)
    const importe = Number(total)

    if (!Number.isInteger(cliente) || cliente <= 0) {
      setError('El identificador del cliente debe ser un entero positivo.')
      return
    }

    if (!direccion.trim() || direccion.trim().length < 5) {
      setError('Escribe una dirección de entrega de al menos 5 caracteres.')
      return
    }

    if (!Number.isFinite(importe) || importe <= 0) {
      setError('El total debe ser un número mayor que cero.')
      return
    }

    setGuardando(true)

    try {
      const response = await fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente,
          direccion_entrega: direccion.trim(),
          total: importe,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'No fue posible registrar el pedido.'
        )
      }

      const nuevoPedido = await response.json()

      setMensaje(`¡Pedido #${nuevoPedido.id} registrado correctamente!`)
      setDireccion('')
      setTotal('')
      setFiltroEstado('todos')
      await cargarPedidos()
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar el pedido.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(pedidoId, nuevoEstado) {
    setError('')
    setMensaje('')
    setActualizandoEstado(pedidoId)

    try {
      const response = await fetch(
        `${API_URL}/pedidos/${pedidoId}/estado`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'No fue posible actualizar el estado.'
        )
      }

      setMensaje(
        `Estado del pedido #${pedidoId} actualizado correctamente.`
      )
      await cargarPedidos()
    } catch (err) {
      setError(err.message || 'Ocurrió un error al actualizar el estado.')
    } finally {
      setActualizandoEstado(null)
    }
  }

  function formatoFecha(fecha) {
    if (!fecha) return 'No disponible'

    const fechaValida = new Date(fecha)

    if (Number.isNaN(fechaValida.getTime())) return fecha

    return fechaValida.toLocaleString('es-SV')
  }

  return (
    
<main className="page-shell">
  <aside className="sidebar">
    <a
      className="brand"
      href="#"
      aria-label="Delivery Express inicio"
      onClick={(event) => {
        event.preventDefault()
        setPestanaActiva('inicio')
      }}
    >
      <span className="brand-mark">
        <UtensilsCrossed size={22} />
      </span>
      <span>
        Delivery <b>Express</b>
      </span>
    </a>

    <div className="sidebar-heading">MENÚ PRINCIPAL</div>

    <nav className="nav-tabs" aria-label="Navegación principal">
      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'inicio' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('inicio')}
      >
        <UtensilsCrossed size={18} />
        <span>Inicio</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'catalogo' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('catalogo')}
      >
        <ShoppingBag size={18} />
        <span>Catálogo</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'pedidos' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('pedidos')}
      >
        <ClipboardList size={18} />
        <span>Pedidos</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'administracion' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('administracion')}
      >
        <ListFilter size={18} />
        <span>Administración</span>
      </button>

      <button
        type="button"
        className={`nav-tab ${pestanaActiva === 'repartidores' ? 'active' : ''}`}
        onClick={() => setPestanaActiva('repartidores')}
      >
        <Bike size={18} />
        <span>Repartidores</span>
      </button>
    </nav>

    <div className="sidebar-footer">
      <span
        className={
          apiStatus.toLowerCase().includes('no conectada')
            ? 'status-dot'
            : 'status-dot online'
        }
      />
      <span>{apiStatus}</span>
    </div>
  </aside>

  <div className="main-content">
      
      {pestanaActiva === 'inicio' && ( <>
          <section className="hero hero-reference">
            <div
              className="hero-visual hero-visual-integrated"
              aria-hidden="true"
            >
              <img
                className="hero-reference-image"
                src="/hero-delivery.jpg"
                alt=""
              />
            </div>

            <div className="hero-copy">
              <p className="eyebrow">
                PEDIDOS · ADMINISTRACIÓN · ENTREGAS
              </p>

              <h1>
                Todo tu delivery,
                <br />
                <span>en un solo lugar.</span>
              </h1>

              <p className="hero-description">
                Una plataforma para organizar pedidos, administrar productos
                y coordinar las entregas a domicilio.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setPestanaActiva('pedidos')}
                >
                  Gestionar pedidos
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
          <section id="modulos" className="modules-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">PLATAFORMA</p>
                <h2>Módulos del sistema</h2>
              </div>
              <p>Un espacio de trabajo para cada tipo de usuario.</p>
              </div>
              <div className="module-grid">
                {roles.map(({ title, description, icon: Icon, tag }) => (
                  <article className="module-card" key={title}>
                    <div className="module-icon">
                      <Icon size={23} />
                    </div>
                  <span className="module-tag">{tag}</span>
                    <h3>{title}</h3>
                  <p>{description}</p>
                  <button className="module-status" type="button" onClick={() => setPestanaActiva('pedidos')}> Ir a pedidos <span>↗</span> </button>
                  </article>
                  ))}
              </div>
            </section>
          </>)}      
      {/* CATÁLOGO DE PRODUCTOS */}
      {pestanaActiva === 'catalogo' && (<>
      <section className="catalog-section">
        <div className="section-heading section-heading-modern">
          <div className="section-title-group">
            <p className="eyebrow">NUESTRO MENÚ</p>
            <h2>Catálogo de productos</h2>
            <p>Explora las categorías y descubre lo que puedes pedir.</p>
            </div>
            <button type="button" className="refresh-button" onClick={cargarCatalogo} title="Actualizar catálogo">
              <RefreshCw size={18} /> Actualizar
            </button>
        </div>
        <div className="catalog-categories">
          {categorias.map((categoria) => (
            <div className="category-card" key={categoria.id}>
              <span className="category-icon">
                <UtensilsCrossed size={22} />
              </span>
              <div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="product-grid">
          {productos.length > 0 ? (
            productos.map((producto) => (
              <article className="product-card" key={producto.id}>
                <div className="product-image-placeholder">
                  <ShoppingBag size={34} />
                </div>

                <div className="product-content">
                  <span className="product-category">
                    {categorias.find(
                      (categoria) => categoria.id === producto.categoria_id
                    )?.nombre || 'Producto'}
                  </span>

                  <h3>{producto.nombre}</h3>
                  <p>{producto.descripcion || 'Delicioso y preparado para ti.'}</p>

                  <div className="product-footer">
                    <strong>${Number(producto.precio).toFixed(2)}</strong>
                    <span className="availability-label">
                      Disponible
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="catalog-empty">
              No hay productos disponibles en este momento.
            </p>
          )}
        </div>
      </section>
      </>)}
      {pestanaActiva === 'pedidos' && (<>
      <section id="pedidos" className="orders-section">
        <div className="section-heading section-heading-modern">
          <div className="section-title-group">
            <p className="eyebrow">GESTIÓN DE PEDIDOS</p>
            <h2>Registrar un pedido</h2>
            <p>Registra nuevos pedidos y consulta su información.</p>
          </div>
          <div className="orders-header-note">
            <span className="orders-status-indicator" />
            Conectado con la base de datos
          </div>
        </div>
        <form className="order-form" onSubmit={crearPedido}>
          <div className="form-field">
            <label htmlFor="clienteId">ID del cliente</label>
            <input
              id="clienteId"
              type="number"
              min="1"
              step="1"
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              required
            />
            <small>
              Por ahora utilizamos el cliente de prueba número 1.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="direccion">Dirección de entrega</label>
            <input
              id="direccion"
              type="text"
              minLength="5"
              maxLength="300"
              placeholder="Ej. Colonia Escalón, San Salvador"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="total">Total del pedido ($)</label>
            <input
              id="total"
              type="number"
              min="0.01"
              max="99999999.99"
              step="0.01"
              placeholder="Ej. 12.50"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              required
            />
          </div>

          <button
            className="primary-button form-submit"
            type="submit"
            disabled={guardando}
          >
            <PlusCircle size={18} />
            {guardando ? 'Guardando…' : 'Registrar pedido'}
          </button>
        </form>

        {mensaje && (
          <p className="feedback success-message" role="status">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="feedback error-message" role="alert">
            {error}
          </p>
        )}

        <div className="orders-heading">
          <div>
            <p className="eyebrow">BASE DE DATOS</p>
            <h2>Pedidos registrados ({pedidos.length})</h2>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={cargarPedidos}
            disabled={cargando}
          >
            <RefreshCw size={16} />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="order-filters">
          <div className="filter-heading">
            <ListFilter size={18} />
            <span>Filtrar por estado</span>
          </div>

          <div className="filter-options">
            {filtrosPedido.map((filtro) => {
              const cantidad =
                filtro.valor === 'todos'
                  ? pedidos.length
                  : pedidos.filter(
                      (pedido) => pedido.estado === filtro.valor
                    ).length

              return (
                <button
                  key={filtro.valor}
                  type="button"
                  className={`filter-button ${
                    filtroEstado === filtro.valor ? 'active' : ''
                  }`}
                  onClick={() => setFiltroEstado(filtro.valor)}
                  aria-pressed={filtroEstado === filtro.valor}
                >
                  {filtro.etiqueta}
                  <span className="filter-count">{cantidad}</span>
                </button>
              )
            })}
          </div>

          <p className="filter-summary">
            Mostrando <strong>{pedidosFiltrados.length}</strong> de{' '}
            <strong>{pedidos.length}</strong> pedidos.
          </p>
        </div>

        {cargando && pedidos.length === 0 ? (
          <p className="empty-state">Cargando pedidos…</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="empty-state">
            {pedidos.length === 0
              ? 'Todavía no hay pedidos registrados.'
              : 'No hay pedidos con este estado.'}
          </p>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha de creación</th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.cliente_id}</td>
                    <td>{pedido.direccion_entrega}</td>
                    <td>${Number(pedido.total).toFixed(2)}</td>
                    <td>
                      <select
                        className={`order-status-select estado-${pedido.estado.replaceAll(' ', '-')}`}
                        value={pedido.estado}
                        disabled={actualizandoEstado === pedido.id}
                        onChange={(event) =>
                          cambiarEstado(pedido.id, event.target.value)
                        }
                        aria-label={`Cambiar estado del pedido ${pedido.id}`}
                      >
                        {estadosPedido.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() +
                              estado.slice(1)}
                          </option>
                        ))}
                      </select>

                      {actualizandoEstado === pedido.id && (
                        <small className="saving-status">Guardando…</small>
                      )}
                    </td>
                    <td>{formatoFecha(pedido.fecha_creacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </> )}
      {pestanaActiva === 'administracion' && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PANEL DE CONTROL</p>
              <h2>Administración</h2>
            </div>
            <p>Gestiona y supervisa las operaciones de Delivery Express.</p>
          </div>

          <div className="workspace-grid">
            <article className="module-card">
              <div className="module-icon">
                <ShoppingBag size={23} />
              </div>
              <h3>Catálogo de productos</h3>
              <p>Consulta las categorías y los productos disponibles.</p>
              <button
                className="module-status"
                type="button"
                onClick={() => setPestanaActiva('catalogo')}
              >
                Ver catálogo <span>↗</span>
              </button>
            </article>

            <article className="module-card">
              <div className="module-icon">
                <ClipboardList size={23} />
              </div>
              <h3>Gestión de pedidos</h3>
              <p>Consulta los pedidos y actualiza sus estados.</p>
              <button
                className="module-status"
                type="button"
                onClick={() => setPestanaActiva('pedidos')}
              >
                Ver pedidos <span>↗</span>
              </button>
            </article>
          </div>
        </section>
      )}

      {pestanaActiva === 'repartidores' && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CENTRO DE ENTREGAS</p>
              <h2>Portal del repartidor</h2>
            </div>
            <p>Espacio destinado al seguimiento de las entregas.</p>
          </div>

          <div className="workspace-grid">
            <article className="module-card">
              <div className="module-icon">
                <Bike size={23} />
              </div>
              <h3>Entregas asignadas</h3>
              <p>
                Aquí incorporaremos la consulta de pedidos asignados
                a cada repartidor.
              </p>
              <span className="module-tag">Próximamente</span>
            </article>

            <article className="module-card">
              <div className="module-icon">
                <ClipboardList size={23} />
              </div>
              <h3>Estado de las entregas</h3>
              <p>
                Aquí incorporaremos la actualización y el seguimiento
                de las entregas.
              </p>
              <span className="module-tag">Próximamente</span>
            </article>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>© Delivery Express </span>

        <span className="api-status">
          <span
            className={
              apiStatus.toLowerCase().includes('no conectada')
                ? 'status-dot'
                : 'status-dot online'
            }
          />
          {apiStatus}
        </span>
            </footer>
      </div>
    </main>
  )
}