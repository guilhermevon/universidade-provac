import sys
from fpdf import FPDF


def generate_pdf(input_file, output_file, password):
    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Arial", size=12)

    with open(input_file, 'r', encoding='utf-8') as file:
        for line in file:
            pdf.cell(200, 10, txt=line, ln=True)

    pdf.output(output_file)

    print(f'PDF gerado em: {output_file}')


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Uso: python generate_pdf.py <arquivo_entrada> <arquivo_saida> <senha>")
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        password = sys.argv[3]
        generate_pdf(input_file, output_file, password)
