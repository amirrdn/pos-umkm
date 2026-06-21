import { forwardRef } from 'react';

export interface TransactionItemData {
  id?: string;
  quantity: number;
  priceAtTransaction: number;
  subtotal: number;
  product?: {
    name: string;
    sku: string;
  };
  name?: string;
  price?: number;
}

export interface TransactionData {
  invoiceNumber: string;
  createdAt: string;
  grandTotal: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  cashierName?: string;
  tenantName?: string;
  items: TransactionItemData[];
  subTotal?: number;
  discount?: number;
  tax?: number;
  customer?: {
    id: string;
    name: string;
    points: number;
  } | null;
  outlet?: {
    id: string;
    name: string;
    type: string;
    address: string | null;
    phone: string | null;
  } | null;
}

interface ReceiptTemplateProps {
  transactionData: TransactionData | null;
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ transactionData }, ref) => {
    if (!transactionData) return null;

    const items = transactionData.items || [];
    const formattedDate = new Date(transactionData.createdAt).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return (
      <div
        ref={ref}
        className="w-[58mm] bg-white text-black p-4 font-mono text-[10px] leading-tight select-none print:p-2"
        style={{
          boxSizing: 'border-box',
          fontFamily: 'Courier New, Courier, monospace',
        }}
      >
        {/* Header Toko */}
        <div className="text-center mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            {transactionData.outlet?.name || transactionData.tenantName || 'UMKM POS'}
          </h2>
          {transactionData.outlet ? (
            <>
              {transactionData.outlet.address && (
                <p className="text-[9px] text-slate-700">{transactionData.outlet.address}</p>
              )}
              {transactionData.outlet.phone && (
                <p className="text-[9px] text-slate-700">Telp: {transactionData.outlet.phone}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-[9px] text-slate-700">SaaS POS Premium Edition</p>
              <p className="text-[9px] text-slate-700">Jl. Pembangunan Raya No. 123</p>
              <p className="text-[9px] text-slate-700">Telp: 0812-3456-7890</p>
            </>
          )}
        </div>

        {/* Garis Pembatas */}
        <div className="text-center text-slate-500 my-1 font-bold">
          --------------------------------
        </div>

        {/* Informasi Transaksi */}
        <div className="space-y-0.5 text-[9px] text-slate-800">
          <div className="flex justify-between">
            <span>No. Invoice:</span>
            <span className="font-bold">{transactionData.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tanggal:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{transactionData.cashierName || 'Kasir Toko'}</span>
          </div>
        </div>

        {/* Garis Pembatas */}
        <div className="text-center text-slate-500 my-1 font-bold">
          --------------------------------
        </div>

        {/* Daftar Barang Belanja */}
        <div className="space-y-2 my-2">
          {items.map((item, index) => {
            const productName = item.product?.name || item.name || 'Produk';
            const quantity = item.quantity;
            const price = item.priceAtTransaction || item.price || 0;
            const subtotal = item.subtotal || (quantity * price);

            return (
              <div key={item.id || index} className="space-y-0.5">
                {/* Nama produk (bisa wrap jika terlalu panjang di kertas 58mm) */}
                <div className="font-bold text-[10px] break-words">
                  {productName}
                </div>
                {/* Kuantitas x Harga dan Subtotal */}
                <div className="flex justify-between text-[9px] text-slate-700 pl-2">
                  <span>
                    {quantity} x Rp {Number(price).toLocaleString('id-ID')}
                  </span>
                  <span>
                    Rp {Number(subtotal).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garis Pembatas */}
        <div className="text-center text-slate-500 my-1 font-bold">
          --------------------------------
        </div>

        {/* Rincian Pembayaran */}
        <div className="space-y-1 text-[9px] text-slate-800">
          {transactionData.subTotal !== undefined && (
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {Number(transactionData.subTotal).toLocaleString('id-ID')}</span>
            </div>
          )}
          {transactionData.discount !== undefined && Number(transactionData.discount) > 0 && (
            <div className="flex justify-between">
              <span>Diskon:</span>
              <span>-Rp {Number(transactionData.discount).toLocaleString('id-ID')}</span>
            </div>
          )}
          {transactionData.tax !== undefined && Number(transactionData.tax) > 0 && (
            <div className="flex justify-between">
              <span>PPN (11%):</span>
              <span>Rp {Number(transactionData.tax).toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[10px] border-t border-dotted border-slate-300 pt-0.5 mt-0.5">
            <span>TOTAL TAGIHAN:</span>
            <span>Rp {Number(transactionData.grandTotal).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Metode Bayar:</span>
            <span className="font-semibold">
              {transactionData.paymentMethod === 'CASH' ? 'TUNAI (CASH)' : 'QRIS / E-WALLET'}
            </span>
          </div>

          {transactionData.paymentMethod === 'CASH' && (
            <>
              <div className="flex justify-between">
                <span>Uang Diterima:</span>
                <span>Rp {(transactionData.cashReceived || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-dotted border-slate-300 pt-0.5 mt-0.5">
                <span>Kembalian:</span>
                <span>Rp {(transactionData.change || 0).toLocaleString('id-ID')}</span>
              </div>
            </>
          )}

          {transactionData.customer && (
            <>
              <div className="border-t border-dotted border-slate-350 my-1"></div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-semibold">{transactionData.customer.name}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Poin Baru:</span>
                <span>+{Math.floor(Number(transactionData.grandTotal) / 10000)} Pts</span>
              </div>
              <div className="flex justify-between">
                <span>Total Poin:</span>
                <span>{transactionData.customer.points} Pts</span>
              </div>
            </>
          )}
        </div>

        {/* Garis Pembatas */}
        <div className="text-center text-slate-500 my-2 font-bold">
          --------------------------------
        </div>

        {/* Footer Struk */}
        <div className="text-center mt-3 space-y-0.5 text-[9px] text-slate-700">
          <p className="font-bold">Terima Kasih</p>
          <p>Selamat Belanja Kembali</p>
          <p className="text-[7px] text-slate-400 mt-2">Sistem POS</p>
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';
